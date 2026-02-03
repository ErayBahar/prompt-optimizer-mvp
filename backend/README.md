# Prompt Refiner MVP - Backend

> 🚀 AI destekli prompt analiz ve optimizasyon servisi

Kullanıcı promptlarını analiz edip, daha etkili ve yapılandırılmış hale getiren RESTful API servisi.

---

## 📋 Özellikler

- **Prompt Analizi**: Promptları 6 bileşene ayırma (Task, Role, Style, Output, Rules, Context)
- **Skor Hesaplama**: Her bileşen için 0-10 arası kalite skoru
- **Prompt Optimizasyonu**: AI destekli prompt iyileştirme
- **Geçmiş Yönetimi**: Prompt history, favoriler ve silme
- **Kullanıcı Yönetimi**: Firebase Auth entegrasyonu
- **Token İzleme**: Prompt ve completion token sayıları

---

## 🏗️ Proje Yapısı

```
backend/
├── main.py                 # FastAPI uygulama giriş noktası
├── requirements.txt        # Python bağımlılıkları
├── .env                    # Ortam değişkenleri (git'e eklenmez)
│
├── core/
│   └── config.py           # Uygulama konfigürasyonu
│
├── routers/
│   ├── prompt_router.py    # Prompt analiz/optimizasyon endpoint'leri
│   ├── user_router.py      # Kullanıcı yönetimi endpoint'leri
│   └── auth_router.py      # Authentication endpoint'leri
│
├── schemas/
│   ├── prompt.py           # Prompt Pydantic modelleri
│   └── user.py             # User Pydantic modelleri
│
└── services/
    ├── firebase_db.py      # Firestore veritabanı bağlantısı
    ├── nebius_ai.py        # Nebius AI API entegrasyonu
    └── serviceAccountKey.json  # Firebase credentials (git'e eklenmez)
```

---

## 🚀 Kurulum

### 1. Gereksinimler

- Python 3.10+
- Firebase projesi (Firestore aktif)
- Nebius AI API key

### 2. Repository'yi Klonlayın

```bash
git clone https://github.com/canreves/prompt-refiner-mvp.git
cd prompt-refiner-mvp/backend
```

### 3. Virtual Environment Oluşturun

```bash
python -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 4. Bağımlılıkları Yükleyin

```bash
pip install -r requirements.txt
```

### 5. Ortam Değişkenlerini Ayarlayın

`.env` dosyası oluşturun:

```bash
# API Keys
NEBIUS_API_KEY=your_nebius_api_key_here

# Firebase (serviceAccountKey.json dosya yolu)
FIREBASE_CREDENTIALS=backend/services/serviceAccountKey.json
```

### 6. Firebase Credentials

1. [Firebase Console](https://console.firebase.google.com/) → Proje Ayarları → Hizmet Hesapları
2. "Yeni özel anahtar oluştur" butonuna tıklayın
3. İndirilen JSON dosyasını `backend/services/serviceAccountKey.json` olarak kaydedin

> ⚠️ **Önemli**: `serviceAccountKey.json` dosyasını asla git'e commit etmeyin!

### 7. Sunucuyu Başlatın

```bash
# Backend klasöründen
cd backend

# Uvicorn ile çalıştırın
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Sunucu `http://localhost:8000` adresinde çalışacaktır.

---

## 📚 API Dokümantasyonu

Sunucu çalışırken interaktif API dokümantasyonuna erişebilirsiniz:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🔌 API Endpoint'leri

### Health Check

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Sistem durumu kontrolü |

**Örnek Response:**
```json
{
    "status": "System Operational",
    "architecture": "Modular"
}
```

---

### Prompt İşlemleri

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/v1/parse` | Prompt'u analiz et ve skorla |
| POST | `/api/v1/optimize` | Tek adımda analiz + optimizasyon |
| POST | `/api/v1/optimizeExisting/{prompt_id}` | Mevcut prompt'u optimize et |
| GET | `/api/v1/history/{user_id}` | Kullanıcı geçmişini getir |
| DELETE | `/api/v1/prompt/{prompt_id}` | Prompt'u sil |
| PUT | `/api/v1/prompt/{prompt_id}/favorite` | Favori durumunu değiştir |

#### POST `/api/v1/parse`

Prompt'u analiz eder ve 6 bileşene ayırır.

**Request:**
```json
{
    "userID": "user-123",
    "inputPrompt": "Write a professional blog post about AI trends in 2024"
}
```

**Response:**
```json
{
    "status": "success",
    "promptID": "550e8400-e29b-41d4-a716-446655440000",
    "parsedData": {
        "task": "Write a professional blog post",
        "task_score": 7,
        "role": "",
        "role_score": 0,
        "style": "professional",
        "style_score": 6,
        "output": "blog post",
        "output_score": 5,
        "rules": "",
        "rules_score": 0,
        "context": "AI trends in 2024",
        "context_score": 7
    },
    "overallScores": 5.0,
    "completionTokens": 150,
    "promptTokens": 85,
    "parseLatencyMs": 1234.56
}
```

#### POST `/api/v1/optimize`

Tek istekte analiz ve optimizasyon yapar.

**Request:**
```json
{
    "userID": "user-123",
    "inputPrompt": "Write a blog post about AI"
}
```

**Query Parameters:**
- `ai_model` (opsiyonel): Kullanılacak AI modeli (default: `openai/gpt-oss-20b`)

**Response:**
```json
{
    "status": "success",
    "promptID": "550e8400-e29b-41d4-a716-446655440000",
    "parsedData": { ... },
    "overallScores": 5.0,
    "optimizedPromptID": "660e8400-e29b-41d4-a716-446655440001",
    "optimizedPrompt": "As a professional content strategist...",
    "initialTokenSize": 150,
    "finalTokenSize": 280,
    "parseLatencyMs": 1200.0,
    "optimizeLatencyMs": 1800.0,
    "totalLatencyMs": 3000.0
}
```

---

### Kullanıcı İşlemleri

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/v1/create` | Yeni kullanıcı oluştur |
| GET | `/api/v1/{user_id}` | Kullanıcı bilgilerini getir |
| POST | `/api/v1/login` | Kullanıcı girişi |
| POST | `/api/v1/{user_id}/addProject` | Kullanıcıya proje ekle |

#### POST `/api/v1/create`

**Request:**
```json
{
    "name": "John",
    "surname": "Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "profileImageURL": "https://example.com/image.jpg"
}
```

---

### Authentication

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/v1/verify-token` | Firebase token doğrulama |
| GET | `/api/v1/user/{uid}` | UID ile kullanıcı getir |

#### POST `/api/v1/verify-token`

**Request:**
```json
{
    "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6..."
}
```

**Response:**
```json
{
    "uid": "abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://...",
    "is_new_user": false
}
```

---

## 🧠 Skor Sistemi

Her prompt 6 bileşen üzerinden 0-10 arası skorlanır:

| Bileşen | Açıklama | Örnek |
|---------|----------|-------|
| **Task** | Ne yapılacak? | "Blog yazısı yaz" |
| **Role** | AI'ın rolü | "Deneyimli bir editör olarak" |
| **Style** | Yazım tarzı | "Profesyonel, samimi" |
| **Output** | Beklenen çıktı formatı | "Markdown formatında, 1000 kelime" |
| **Rules** | Kısıtlamalar | "Jargon kullanma" |
| **Context** | Arka plan bilgisi | "Teknoloji blog'u için" |

### Skor Ağırlıkları

Varsayılan ağırlıklar (özelleştirilebilir):

```python
weights = {
    "task": 2,
    "role": 2,
    "style": 2,
    "output": 2,
    "rules": 2,
    "context": 2  # (hesaplamada varsayılan olarak dahil değil)
}
```

---

## 🔧 Konfigürasyon

`core/config.py` dosyasında ayarlar:

```python
class Settings:
    PROJECT_NAME: str = "Prompt Refiner MVP"
    VERSION: str = "1.0.0"
    
    # API keys (from .env)
    NEBIUS_API_KEY: str = os.getenv("NEBIUS_API_KEY")
    FIREBASE_CREDENTIALS: str = os.getenv("FIREBASE_CREDENTIALS")
    
    # Default AI model
    NEBIUS_MODEL: str = "openai/gpt-oss-20b"
```

---

## 🗄️ Veritabanı Şeması (Firestore)

### `prompts` Collection

```javascript
{
    promptID: "uuid",
    userID: "user-id",
    projectID: "default-project",
    inputPrompt: "original prompt text",
    parsedData: {
        task: "...", task_score: 8,
        role: "...", role_score: 5,
        // ... diğer bileşenler
    },
    optimizedPrompts: {
        "optimized-id-1": "optimized text..."
    },
    usedLLMs: {
        "optimized-id-1": "openai/gpt-oss-20b"
    },
    initialTokenSize: 150,
    finalTokenSizes: { "optimized-id-1": 280 },
    latencyMs: { "optimized-id-1": 1800.5 },
    overallScores: 6.5,
    createdAt: Timestamp,
    isFavorite: false,
    ratings: { "optimized-id-1": 4 }
}
```

### `users` Collection

```javascript
{
    uid: "firebase-uid",
    email: "user@example.com",
    name: "John Doe",
    profileImageURL: "https://...",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T12:00:00Z",
    projectIDs: ["project-1", "project-2"]
}
```

---

## 🧪 Test (Henüz İmplemente Edilmedi)

```bash
# Testleri çalıştır
pytest tests/ -v

# Coverage ile
pytest tests/ --cov=. --cov-report=html
```

---

## 🐛 Troubleshooting

### Firebase Bağlantı Hatası

```
Firebase Admin SDK initialization failed
```

**Çözüm**: `serviceAccountKey.json` dosyasının doğru yolda olduğundan emin olun.

### Nebius API Hatası

```
OpenAI API error: Invalid API key
```

**Çözüm**: `.env` dosyasındaki `NEBIUS_API_KEY` değerini kontrol edin.

### CORS Hatası

Frontend'den istek atarken CORS hatası alıyorsanız, `main.py`'deki `allow_origins` ayarını kontrol edin.

---

## 📝 Yapılacaklar

- [ ] Unit testler eklenmeli
- [ ] Rate limiting implementasyonu
- [ ] API key authentication
- [ ] Logging sistemi kurulumu
- [ ] Docker compose dosyası
- [ ] CI/CD pipeline

---

## 📄 Lisans

MIT

---

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın
