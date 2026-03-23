<div align="center">

# 🎯 RoutineTracker

### Seu assistente pessoal de hábitos com IA

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=flat-square&logo=openai)](https://openai.com/)
[![Google Maps](https://img.shields.io/badge/Google-Maps%20API-4285F4?style=flat-square&logo=googlemaps)](https://developers.google.com/maps)

[Demo](https://routine-tracker.com) · [Reportar Bug](https://github.com/rafaelferreiram/routineTracker/issues) · [Sugerir Feature](https://github.com/rafaelferreiram/routineTracker/issues)

</div>

---

## ✨ Sobre o Projeto

**RoutineTracker** é um aplicativo de rastreamento de hábitos gamificado com um assistente de IA integrado chamado **TARS** (inspirado no filme Interstellar). Acompanhe seus hábitos diários, planeje eventos e viagens, e deixe o TARS te ajudar a organizar sua vida!

<div align="center">

### 🎮 Gamificação + 🤖 IA + 📅 Planejamento = Produtividade

</div>

---

## 🚀 Features Principais

### 📊 Rastreamento de Hábitos
- **Hábitos personalizados** com emojis e categorias
- **Histórico de 21 dias** editável com grid interativo
- **Streaks e conquistas** para manter a motivação
- **Animação de fogo** 🔥 para streaks ativos
- **XP e níveis** - gamificação completa

### 🤖 TARS - Assistente de IA
- **Conversas por texto e voz** (Speech-to-Text / Text-to-Speech)
- **Criação de hábitos e eventos** por comando de voz ou texto
- **Busca de lugares reais** usando Google Places API
- **Planejamento de roteiros** para viagens e eventos
- **Previsão do tempo** em tempo real
- **Fallback automático** entre API keys

### 📅 Eventos e Viagens
- **Eventos multi-dia** com suporte a fotos
- **Planejador de itinerário** com 3 colunas:
  - 📋 Roteiro do dia
  - 🗺️ Busca de lugares (Google Maps)
  - 🤖 Assistente IA
- **Exportação para calendário** (.ics)
- **Memórias** com fotos e mood tracking

### 🔐 Autenticação
- **Login com Email/Senha**
- **Login com Google** (OAuth 2.0)
- **Sincronização de contas** - mesmo email = mesmos dados

### 📱 Mobile-First
- **Design responsivo** Instagram-style
- **Bottom navigation bar** 
- **PWA ready** - instale como app
- **Onboarding interativo** para novos usuários

---

## 🛠️ Tech Stack

### Frontend
| Tecnologia | Uso |
|------------|-----|
| React 18 | UI Framework |
| Vite 5 | Build Tool |
| Tailwind CSS 3 | Styling |
| Shadcn/UI | Componentes |
| Zustand | State Management |

### Backend
| Tecnologia | Uso |
|------------|-----|
| FastAPI | API Framework |
| MongoDB Atlas | Database |
| PyMongo | MongoDB Driver |
| JWT | Autenticação |

### Integrações
| Serviço | Uso |
|---------|-----|
| OpenAI GPT-4o | Chat AI + Function Calling |
| OpenAI Whisper | Speech-to-Text |
| OpenAI TTS | Text-to-Speech |
| Google Maps API | Mapas e Places |
| Google Places API | Busca de locais |
| Open-Meteo | Previsão do tempo |

---

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- Python 3.10+
- MongoDB (local ou Atlas)
- Chaves de API (OpenAI, Google Maps)

### Clone o repositório
```bash
git clone https://github.com/rafaelferreiram/routineTracker.git
cd routineTracker
```

### Backend
```bash
cd backend
pip install -r requirements.txt

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Inicie o servidor
uvicorn server:app --reload --port 8001
```

### Frontend
```bash
cd frontend
yarn install

# Configure as variáveis de ambiente
cp .env.example .env

# Inicie o servidor de desenvolvimento
yarn dev
```

---

## ⚙️ Variáveis de Ambiente

### Backend (`backend/.env`)
```env
MONGO_URL=mongodb+srv://...
DB_NAME=routinetracker
JWT_SECRET=your_secret_key
OPENAI_API_KEY=sk-...
GOOGLE_MAPS_API_KEY=AIza...
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=/api
VITE_GOOGLE_MAPS_API_KEY=AIza...
```

---

## 🎯 Como Usar

### 1️⃣ Criar uma conta
- Clique em "Login" e crie uma conta com email/senha
- Ou faça login com sua conta Google

### 2️⃣ Adicionar hábitos
- Use o botão "+" ou peça ao TARS: *"Crie um hábito de meditar diariamente"*

### 3️⃣ Planejar eventos
- Crie eventos multi-dia como viagens
- Use o TARS para buscar lugares: *"Busque restaurantes italianos em Times Square"*
- Adicione ao roteiro: *"Adicione o restaurante X às 19h no dia 18/04"*

### 4️⃣ Conversar com TARS
- Clique no ícone do robô 🤖 na barra de navegação
- Fale por texto ou use o microfone 🎤
- Pergunte qualquer coisa: clima, recomendações, planejamento

---

## 📁 Estrutura do Projeto

```
routineTracker/
├── backend/
│   ├── server.py          # API principal (FastAPI)
│   ├── requirements.txt   # Dependências Python
│   └── tests/             # Testes automatizados
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   │   ├── AIChat.jsx           # Modal do TARS
│   │   │   ├── EventItinerary.jsx   # Planejador de roteiro
│   │   │   ├── PlaceSearch.jsx      # Busca Google Maps
│   │   │   └── ...
│   │   ├── store/         # Estado global
│   │   └── api/           # Cliente API
│   └── public/
│       └── tars-icon.png  # Ícone do TARS
│
└── memory/
    └── PRD.md             # Documentação do produto
```

---

## 🤖 Comandos do TARS

| Comando | Exemplo |
|---------|---------|
| Criar hábito | *"Crie um hábito de ler 30 minutos por dia"* |
| Editar hábito | *"Mude a frequência do hábito Gym para 3x por semana"* |
| Criar evento | *"Crie um evento de viagem para Paris de 10 a 15 de maio"* |
| Buscar lugares | *"Encontre cafés perto do Central Park"* |
| Adicionar ao roteiro | *"Adicione visita ao MoMA às 14h no dia 12"* |
| Ver roteiro | *"Mostre o roteiro da minha viagem NYC"* |
| Previsão do tempo | *"Como está o tempo em São Paulo?"* |
| Listar hábitos | *"Quais são meus hábitos?"* |
| Listar eventos | *"Quais eventos tenho planejados?"* |

---

## 🧪 Testes

```bash
# Backend
cd backend
pytest tests/ -v

# Frontend (lint)
cd frontend
yarn lint
```

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Rafael Ferreira**
- GitHub: [@rafaelferreiram](https://github.com/rafaelferreiram)

---

<div align="center">

### ⭐ Se este projeto te ajudou, deixe uma estrela!

Made with ❤️ and ☕ by Rafael Ferreira

</div>
