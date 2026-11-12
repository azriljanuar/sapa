/*
  =============================================================================
  SAPA (Sistem Administrasi Pesantren & Akademik)
  Firmware Presensi RFID Mandiri IoT (Standalone ESP32)
  =============================================================================
  Hardware:
  - Mikrokontroler : ESP32 DevKit V1 (30 / 38 pin)
  - RFID Reader    : RC522 (13.56 MHz SPI) / PN532 SPI
  - Display        : LCD 16x2 atau 20x4 I2C (Address 0x27 / 0x3F)
  - Audio          : Active Buzzer 5V (GPIO 15)
  - Indikator LED  : LED Hijau (GPIO 2) & LED Merah (GPIO 13)

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

  LCD I2C              ESP32 Pin
  ---------------------------------------------------------------------------
  VCC        ------->  VIN (5V)
  GND        ------->  GND
  SDA        ------->  GPIO 21
  SCL        ------->  GPIO 22

  Output Lain          ESP32 Pin
  ---------------------------------------------------------------------------
  Buzzer (+) ------->  GPIO 15
  LED Hijau  ------->  GPIO 2  (dengan resistor 220 Ohm)
  LED Merah  ------->  GPIO 13 (dengan resistor 220 Ohm)
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
// Contoh: "http://192.168.1.50:3000/api/absensi-rfid" atau "https://sapa.pesantren.id/api/absensi-rfid"
const char* SERVER_URL    = "http://192.168.1.23:3000/api/absensi-rfid";

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

// State Debounce Perangkat Keras
String lastCardUid = "";
unsigned long lastTapMillis = 0;
const unsigned long DEBOUNCE_DELAY_MS = 3000; // 3 detik pencegahan tap beruntun kartu sama

// ── FUNGSI DEKLARASI ────────────────────────────────────────────────────────
void inisialisasiHardware();
void hubungkanWiFi();
void tampilkanSiaga();
void prosesTapKartu(String uid);
void bunyikanBuzzer(int beepCode);
void cetakBarisLcd(int baris, String teks);

// ── SETUP ───────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n\n==========================================");
  Serial.println("  SAPA IoT Standalone RFID Reader v2.0   ");
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

  // 2. Deteksi keberadaan kartu RFID baru di atas reader
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  // 3. Ekstrak UID kartu ke dalam format String HEX Kapital (contoh: "A1B2C3D4")
  String cardUid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) cardUid += "0";
    cardUid += String(mfrc522.uid.uidByte[i], HEX);
  }
  cardUid.toUpperCase();

  // Hentikan komunikasi dengan kartu agar siap membaca berikutnya
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  // 4. Cek Debounce (Cegah pembacaan berulang jika kartu masih menempel)
  unsigned long currentMillis = millis();
  if (cardUid == lastCardUid && (currentMillis - lastTapMillis < DEBOUNCE_DELAY_MS)) {
    Serial.println("Debounce: Kartu baru saja ditap (" + cardUid + "), diabaikan.");
    return;
  }

  lastCardUid = cardUid;
  lastTapMillis = currentMillis;

  Serial.println("\n[TAP TERDETEKSI] UID: " + cardUid);
  prosesTapKartu(cardUid);
}

// ── PROSES PENGIRIMAN ABSENSI KE SERVER SAPA ────────────────────────────────
void prosesTapKartu(String uid) {
  // Feedback visual saat proses
  digitalWrite(PIN_LED_GREEN, HIGH);
  digitalWrite(PIN_LED_RED, HIGH);
  lcd.clear();
  cetakBarisLcd(0, "Membaca Kartu...");
  cetakBarisLcd(1, uid);

  // Singkat nada "klik" saat kartu terdeteksi
  digitalWrite(PIN_BUZZER, HIGH);
  delay(40);
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED, LOW);

  if (WiFi.status() != WL_CONNECTED) {
    lcd.clear();
    cetakBarisLcd(0, "Koneksi Terputus");
    cetakBarisLcd(1, "Wi-Fi Offline");
    bunyikanBuzzer(3);
    delay(2000);
    tampilkanSiaga();
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.setTimeout(4000); // 4 detik batas timeout
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_KEY);

  // Buat Payload JSON
  #if ARDUINOJSON_VERSION_MAJOR >= 7
    JsonDocument doc;
  #else
    StaticJsonDocument<256> doc;
  #endif

  doc["rfidUid"] = uid;
  doc["mode"]    = "AUTO";

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
      bool isSuccess    = res["success"] | false;
      const char* nama  = res["nama"] | (isSuccess ? "Berhasil" : "Kartu Baru");
      const char* pesan = res["pesan"] | "Gagal";
      const char* jam   = res["jam"] | "";
      int beepCount     = res["beep"] | (isSuccess ? 1 : 3);

      // Tampilkan Hasil di LCD 16x2
      lcd.clear();
      cetakBarisLcd(0, String(nama));

      // Baris kedua: "Pesan (Jam)" misal: "Tepat Waktu 06:45" atau "Terlambat 10m"
      String line2 = String(pesan);
      if (strlen(jam) > 0) {
        line2 += " " + String(jam);
      }
      cetakBarisLcd(1, line2);

      // Bunyikan Buzzer & Nyalakan LED sesuai status dari server
      bunyikanBuzzer(beepCount);
    } else {
      lcd.clear();
      cetakBarisLcd(0, "Format Respon");
      cetakBarisLcd(1, "JSON Error");
      bunyikanBuzzer(3);
    }
  } else {
    Serial.print("HTTP POST Gagal, Error Code: ");
    Serial.println(httpResponseCode);
    lcd.clear();
    cetakBarisLcd(0, "Gagal Koneksi!");
    cetakBarisLcd(1, "Server Timeout");
    bunyikanBuzzer(3);
  }

  http.end();

  // Berikan jeda 2.5 detik agar santri/guru dapat membaca hasil di layar
  delay(2500);
  tampilkanSiaga();
}

// ── FEEDBACK SUARA (BUZZER) & LAMPU (LED) ──────────────────────────────────
void bunyikanBuzzer(int beepCode) {
  // beepCode 1: Sukses Tepat Waktu (1x Bip Pendek, LED Hijau)
  if (beepCode == 1) {
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_BUZZER, HIGH);
    delay(150);
    digitalWrite(PIN_BUZZER, LOW);
    digitalWrite(PIN_LED_GREEN, LOW);
  }
  // beepCode 2: Peringatan / Terlambat / Sudah Absen (2x Bip Sedang, LED Hijau & Merah)
  else if (beepCode == 2) {
    for (int i = 0; i < 2; i++) {
      digitalWrite(PIN_LED_GREEN, HIGH);
      digitalWrite(PIN_LED_RED, HIGH);
      digitalWrite(PIN_BUZZER, HIGH);
      delay(100);
      digitalWrite(PIN_BUZZER, LOW);
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_RED, LOW);
      delay(90);
    }
  }
  // beepCode 3: Kartu Asing / Ditolak / Error Jaringan (3x Bip Cepat, LED Merah)
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
  // Potong teks jika melebihi 16 karakter agar rapi
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
    bunyikanBuzzer(3);
    delay(2000);
  }
}
