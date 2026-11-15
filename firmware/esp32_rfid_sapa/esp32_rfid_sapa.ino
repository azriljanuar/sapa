/*
  =============================================================================
  SAPA (Sistem Administrasi Pesantren & Akademik)
  Firmware Presensi RFID Mandiri IoT (Standalone ESP32) - v2.1
  =============================================================================
  Fitur Utama:
  - Otomatis Masuk & Pulang murni berdasarkan urutan tap kartu di hari yang sama:
      * Tap 1: Presensi MASUK
      * Tap 2: Presensi PULANG
      * Tap 3+: Peringatan "Absensi Lengkap" (tidak menimpa jam masuk/pulang)
  - Tanpa perlu tombol fisik atau pemilihan mode (Fully Automatic).
  - Anti Double-Tap / Cooldown Hardware (8 detik per kartu) agar kartu yang
    menempel lama tidak langsung mencatat masuk dan pulang sekaligus.
  - Feedback LCD & Buzzer berbeda untuk: Masuk, Pulang, Lengkap, Terlambat, dan Error.

  Hardware:
  - Mikrokontroler : ESP32 DevKit V1 (30 / 38 pin)
  - RFID Reader    : RC522 (13.56 MHz SPI)
  - Display        : LCD 16x2 atau 20x4 I2C (Address 0x27 / 0x3F)
  - Audio          : Active Buzzer 5V (GPIO 27)
  - Indikator LED  : LED Hijau (GPIO 26) & LED Merah (GPIO 25)

  Pinout Wiring:
  ---------------------------------------------------------------------------
  RC522 (SPI)          ESP32 Pin
  ---------------------------------------------------------------------------
  3.3V       ------->  3V3 (PERINGATAN: WAJIB 3.3V, JANGAN 5V!)
  RST        ------->  GPIO 4
  GND        ------->  GND
  MISO       ------->  GPIO 19
  MOSI       ------->  GPIO 23
  SCK        ------->  GPIO 18
  SDA (SS)   ------->  GPIO 5

  LCD I2C (16x2 / 20x4) ESP32 Pin
  ---------------------------------------------------------------------------
  VCC        ------->  VIN (5V)
  GND        ------->  GND
  SDA        ------->  GPIO 21
  SCL        ------->  GPIO 22

  Output Lain          ESP32 Pin
  ---------------------------------------------------------------------------
  Buzzer (+) ------->  GPIO 27
  LED Hijau  ------->  GPIO 26 (dengan resistor 220-330 Ohm)
  LED Merah  ------->  GPIO 25 (dengan resistor 220-330 Ohm)
  =============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// ── 1. KONFIGURASI JARINGAN & SERVER SAPA ───────────────────────────────────
// Ganti dengan SSID dan Password Wi-Fi di lokasi pesantren / sekolah Anda:
const char* WIFI_SSID     = "MA Plus Al-ittihaad";
const char* WIFI_PASSWORD = "januari2026";

// Ganti IP di bawah ini dengan IP lokal / domain server SAPA yang aktif:
// Contoh: "http://192.168.1.76:3000/api/absensi-rfid" atau "https://sapa.pesantren.id/api/absensi-rfid"
const char* SERVER_URL    = "http://192.168.1.76:3000/api/absensi-rfid";

// Secret Device Key (Harus cocok dengan database model PerangkatRfid di SAPA):
const char* DEVICE_KEY    = "sapa_rfid_device_secret_2026";

// ── 2. KONFIGURASI PIN PERANGKAT KERAS ──────────────────────────────────────
#define PIN_RC522_SS   5
#define PIN_RC522_RST  4
#define PIN_BUZZER     27
#define PIN_LED_GREEN  26
#define PIN_LED_RED    25

// Alamat I2C LCD (umumnya 0x27, beberapa modul menggunakan 0x3F)
// Kolom: 16, Baris: 2
LiquidCrystal_I2C lcd(0x27, 16, 2);
MFRC522 mfrc522(PIN_RC522_SS, PIN_RC522_RST);

// ── 3. KONFIGURASI COOLDOWN / DEBOUNCE HARDWARE ──────────────────────────────
// Jeda waktu (5 - 10 detik, default 8000 ms) agar kartu yang menempel lama
// tidak langsung mencatat tap masuk dan tap pulang sekaligus.
const unsigned long COOLDOWN_DELAY_MS = 8000;

#define COOLDOWN_CACHE_SIZE 10
struct CardCooldownEntry {
  String uid;
  unsigned long lastTapMillis;
};
CardCooldownEntry cooldownHistory[COOLDOWN_CACHE_SIZE];
int cooldownHistoryIdx = 0;

bool isCardInCooldown(String uid) {
  unsigned long now = millis();
  for (int i = 0; i < COOLDOWN_CACHE_SIZE; i++) {
    if (cooldownHistory[i].uid == uid) {
      if (now - cooldownHistory[i].lastTapMillis < COOLDOWN_DELAY_MS) {
        return true;
      }
    }
  }
  return false;
}

void registerCardCooldown(String uid) {
  unsigned long now = millis();
  for (int i = 0; i < COOLDOWN_CACHE_SIZE; i++) {
    if (cooldownHistory[i].uid == uid) {
      cooldownHistory[i].lastTapMillis = now;
      return;
    }
  }
  cooldownHistory[cooldownHistoryIdx].uid = uid;
  cooldownHistory[cooldownHistoryIdx].lastTapMillis = now;
  cooldownHistoryIdx = (cooldownHistoryIdx + 1) % COOLDOWN_CACHE_SIZE;
}

// ── FUNGSI DEKLARASI ────────────────────────────────────────────────────────
void inisialisasiHardware();
void hubungkanWiFi();
void tampilkanSiaga();
void prosesTapKartu(String uid);
void berikanFeedback(String code, bool isSuccess, int fallbackBeep);
void cetakBarisLcd(int baris, String teks);

// ── SETUP ───────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n\n==========================================");
  Serial.println("  SAPA IoT Standalone RFID Reader v2.1   ");
  Serial.println("  Auto-Sequence: Masuk -> Pulang         ");
  Serial.println("==========================================");

  inisialisasiHardware();
  hubungkanWiFi();
  tampilkanSiaga();
}

// ── LOOP UTAMA ──────────────────────────────────────────────────────────────
void loop() {
  // 1. Pastikan Wi-Fi tetap terhubung (Auto-Reconnect)
  if (WiFi.status() != WL_CONNECTED) {
    hubungkanWiFi();
  }

  // 2. Deteksi keberadaan kartu RFID di atas reader
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  // 3. Ekstrak UID kartu ke dalam format String HEX Kapital (contoh: "AC317CC3")
  String cardUid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) cardUid += "0";
    cardUid += String(mfrc522.uid.uidByte[i], HEX);
  }
  cardUid.toUpperCase();

  // Hentikan komunikasi dengan kartu agar siap membaca siklus berikutnya
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  // 4. Cek Cooldown (Cegah tap beruntun kartu sama dalam 8 detik)
  if (isCardInCooldown(cardUid)) {
    Serial.println("Cooldown: Kartu " + cardUid + " baru saja ditap (< 8 detik). Diabaikan.");
    delay(100);
    return;
  }

  // Daftarkan UID kartu ke riwayat cooldown
  registerCardCooldown(cardUid);

  Serial.println("\n[TAP TERDETEKSI] UID: " + cardUid);
  prosesTapKartu(cardUid);
}

// ── PROSES PENGIRIMAN ABSENSI KE SERVER SAPA ────────────────────────────────
void prosesTapKartu(String uid) {
  // Feedback visual awal saat kartu pertama kali disentuh
  digitalWrite(PIN_LED_GREEN, HIGH);
  lcd.clear();
  cetakBarisLcd(0, "Membaca Kartu...");
  cetakBarisLcd(1, uid);

  // Singkat nada "klik" pertanda kartu berhasil dideteksi sensor
  digitalWrite(PIN_BUZZER, HIGH);
  delay(35);
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_LED_GREEN, LOW);

  if (WiFi.status() != WL_CONNECTED) {
    lcd.clear();
    cetakBarisLcd(0, "Koneksi Terputus");
    cetakBarisLcd(1, "Wi-Fi Offline");
    berikanFeedback("ERROR_WIFI", false, 3);
    delay(2000);
    tampilkanSiaga();
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.setTimeout(4500); // 4.5 detik batas waktu timeout respons
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_KEY);

  // Buat Payload JSON sederhana (Alat cukup mengirimkan UID kartu)
  #if ARDUINOJSON_VERSION_MAJOR >= 7
    JsonDocument doc;
  #else
    StaticJsonDocument<256> doc;
  #endif

  doc["rfidUid"] = uid;

  String requestBody;
  serializeJson(doc, requestBody);

  Serial.println("Mengirim ke API: " + String(SERVER_URL));
  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode > 0) {
    String responseString = http.getString();
    Serial.println("Respon Server (" + String(httpResponseCode) + "): " + responseString);

    #if ARDUINOJSON_VERSION_MAJOR >= 7
      JsonDocument res;
    #else
      StaticJsonDocument<384> res;
    #endif

    DeserializationError error = deserializeJson(res, responseString);
    if (!error) {
      bool isSuccess     = res["success"] | false;
      const char* code   = res["code"] | "";
      const char* nama   = res["nama"] | (isSuccess ? "Berhasil" : "Kartu Asing");
      const char* pesan  = res["pesan"] | "Gagal";
      const char* jam    = res["jam"] | "";
      int fallbackBeep   = res["beep"] | (isSuccess ? 1 : 3);

      String codeStr = String(code);
      codeStr.toUpperCase();

      // Format Tampilan LCD 16x2
      lcd.clear();
      cetakBarisLcd(0, String(nama));

      String line2 = "";
      if (codeStr == "MASUK_OK") {
        line2 = "Masuk: " + String(jam);
      } else if (codeStr == "PULANG_OK") {
        line2 = "Pulang: " + String(jam);
      } else if (codeStr == "ALREADY_COMPLETED" || codeStr == "ALREADY_CHECKED") {
        line2 = "Absensi Lengkap";
      } else if (codeStr == "DOUBLE_TAP") {
        line2 = "Sudah Ditap Tadi";
      } else if (codeStr == "TERLAMBAT") {
        line2 = String(pesan);
      } else if (codeStr == "UNREGISTERED") {
        cetakBarisLcd(0, "KARTU ASING");
        line2 = "Belum Terdaftar";
      } else if (codeStr == "HARI_LIBUR") {
        cetakBarisLcd(0, "HARI LIBUR");
        line2 = "Tidak Presensi";
      } else {
        line2 = String(pesan);
        if (strlen(jam) > 0) {
          line2 += " " + String(jam);
        }
      }
      cetakBarisLcd(1, line2);

      // Feedback Nada Buzzer & Lampu LED
      berikanFeedback(codeStr, isSuccess, fallbackBeep);
    } else {
      lcd.clear();
      cetakBarisLcd(0, "Format Respon");
      cetakBarisLcd(1, "JSON Error");
      berikanFeedback("JSON_ERROR", false, 3);
    }
  } else {
    Serial.print("HTTP POST Gagal, Error Code: ");
    Serial.println(httpResponseCode);
    lcd.clear();
    cetakBarisLcd(0, "Gagal Koneksi!");
    cetakBarisLcd(1, "Server Timeout");
    berikanFeedback("TIMEOUT", false, 3);
  }

  http.end();

  // Berikan jeda 2.5 detik agar santri/guru dapat membaca feedback di layar
  delay(2500);
  tampilkanSiaga();
}

// ── FEEDBACK SUARA (BUZZER) & LAMPU (LED) ──────────────────────────────────
void berikanFeedback(String code, bool isSuccess, int fallbackBeep) {
  // 1. BERHASIL MASUK: 1x Bip Mantap (200ms) + LED Hijau Nyala
  if (code == "MASUK_OK") {
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_BUZZER, HIGH);
    delay(200);
    digitalWrite(PIN_BUZZER, LOW);
    digitalWrite(PIN_LED_GREEN, LOW);
  }
  // 2. BERHASIL PULANG: 2x Bip Ceria Bertingkat + LED Hijau Kelip 2x
  else if (code == "PULANG_OK") {
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_BUZZER, HIGH);
    delay(120);
    digitalWrite(PIN_BUZZER, LOW);
    digitalWrite(PIN_LED_GREEN, LOW);
    delay(80);
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_BUZZER, HIGH);
    delay(160);
    digitalWrite(PIN_BUZZER, LOW);
    digitalWrite(PIN_LED_GREEN, LOW);
  }
  // 3. SUDAH ABSEN / LENGKAP / DOUBLE TAP: 2x Bip Pendek Peringatan + LED Hijau & Merah
  else if (code == "ALREADY_COMPLETED" || code == "ALREADY_CHECKED" || code == "DOUBLE_TAP") {
    for (int i = 0; i < 2; i++) {
      digitalWrite(PIN_LED_GREEN, HIGH);
      digitalWrite(PIN_LED_RED, HIGH);
      digitalWrite(PIN_BUZZER, HIGH);
      delay(70);
      digitalWrite(PIN_BUZZER, LOW);
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_RED, LOW);
      delay(60);
    }
  }
  // 4. TERLAMBAT: 2x Bip Sedang + LED Kuning (Hijau & Merah)
  else if (code == "TERLAMBAT") {
    for (int i = 0; i < 2; i++) {
      digitalWrite(PIN_LED_GREEN, HIGH);
      digitalWrite(PIN_LED_RED, HIGH);
      digitalWrite(PIN_BUZZER, HIGH);
      delay(110);
      digitalWrite(PIN_BUZZER, LOW);
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_RED, LOW);
      delay(80);
    }
  }
  // 5. KARTU DITOLAK / TIDAK TERDAFTAR / TIMEOUT: 3x Bip Cepat + LED Merah
  else {
    for (int i = 0; i < 3; i++) {
      digitalWrite(PIN_LED_RED, HIGH);
      digitalWrite(PIN_BUZZER, HIGH);
      delay(80);
      digitalWrite(PIN_BUZZER, LOW);
      digitalWrite(PIN_LED_RED, LOW);
      delay(70);
    }
  }
}

// ── TAMPILAN SIAGA (STANDBY SCREEN) ─────────────────────────────────────────
void tampilkanSiaga() {
  lcd.clear();
  cetakBarisLcd(0, " SAPA Presensi ");
  cetakBarisLcd(1, "Tempelkan Kartu");
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED, LOW);
}

// ── HELPER FORMAT LCD 16 KARAKTER ───────────────────────────────────────────
void cetakBarisLcd(int baris, String teks) {
  lcd.setCursor(0, baris);
  // Potong teks jika melebihi 16 karakter agar rapi di LCD 16x2
  if (teks.length() > 16) {
    teks = teks.substring(0, 16);
  }
  lcd.print(teks);
}

// ── INISIALISASI PERANGKAT KERAS ────────────────────────────────────────────
void inisialisasiHardware() {
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);

  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED, LOW);

  // Inisialisasi Layar LCD I2C
  lcd.init();
  lcd.backlight();
  lcd.clear();
  cetakBarisLcd(0, "SAPA Pesantren");
  cetakBarisLcd(1, "Memulai Sistem..");

  // Inisialisasi SPI Bus & MFRC522 RFID
  SPI.begin(18, 19, 23, 5); // SCK, MISO, MOSI, SS
  mfrc522.PCD_Init();
  delay(100);

  // Cek versi modul reader RFID di serial monitor
  mfrc522.PCD_DumpVersionToSerial();
}

// ── KONEKSI WI-FI ───────────────────────────────────────────────────────────
void hubungkanWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("Menghubungkan ke Wi-Fi: ");
  Serial.println(WIFI_SSID);

  lcd.clear();
  cetakBarisLcd(0, "Hubungkan Wi-Fi");
  cetakBarisLcd(1, String(WIFI_SSID).substring(0, 16));

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int percobaan = 0;
  while (WiFi.status() != WL_CONNECTED && percobaan < 25) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_LED_RED, !digitalRead(PIN_LED_RED));
    percobaan++;
  }

  digitalWrite(PIN_LED_RED, LOW);

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi Terhubung!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    digitalWrite(PIN_LED_GREEN, HIGH);
    delay(400);
    digitalWrite(PIN_LED_GREEN, LOW);

    lcd.clear();
    cetakBarisLcd(0, "Wi-Fi Terhubung!");
    cetakBarisLcd(1, WiFi.localIP().toString());
    delay(1500);
  } else {
    Serial.println("\nGagal terhubung ke Wi-Fi!");
    lcd.clear();
    cetakBarisLcd(0, "Wi-Fi Gagal!");
    cetakBarisLcd(1, "Periksa Sandi..");
    berikanFeedback("WIFI_FAIL", false, 3);
    delay(2000);
  }
}
