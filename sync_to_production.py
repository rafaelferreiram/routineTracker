#!/usr/bin/env python3
"""
Script para sincronizar dados do usuário Rafael para produção.
EXECUTE APÓS FAZER DEPLOY!

Uso:
    python3 sync_to_production.py
"""

import requests
import json
import os
import sys

# Configuração
PRODUCTION_URL = "https://routine-tracker.com"
SYNC_SECRET = "routine_sync_2026_secret"
USER_EMAIL = "ferreira.rafah@gmail.com"
DATA_FILE = "data/rafael_export.json"
DEFAULT_PASSWORD = "admin"

def check_endpoint_exists():
    """Verifica se o endpoint de sync existe em produção."""
    try:
        resp = requests.post(
            f"{PRODUCTION_URL}/api/sync/import",
            json={"secret": "test", "email": "test", "data": {}},
            timeout=10
        )
        # Se retornar 403 (invalid secret) ou 404 (user not found), o endpoint existe
        return resp.status_code in [403, 404, 200]
    except:
        return False

def sync_data():
    """Sincroniza os dados do usuário."""
    print("🔄 Sincronizando dados para produção...")
    print(f"   URL: {PRODUCTION_URL}")
    print(f"   Email: {USER_EMAIL}")
    print()
    
    # Verificar se endpoint existe
    print("📡 Verificando se endpoint existe em produção...")
    if not check_endpoint_exists():
        print("❌ Endpoint /api/sync/import NÃO existe em produção!")
        print()
        print("👉 Você precisa fazer DEPLOY primeiro:")
        print("   1. Use 'Save to GitHub' na plataforma Emergent")
        print("   2. Faça deploy para routine-tracker.com")
        print("   3. Execute este script novamente")
        return False
    
    print("✅ Endpoint encontrado!")
    print()
    
    # Carregar dados
    if not os.path.exists(DATA_FILE):
        print(f"❌ Arquivo {DATA_FILE} não encontrado!")
        return False
    
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        export = json.load(f)
    
    user_data = export.get('data', {})
    user_info = export.get('user', {})
    
    print(f"📊 Dados a importar:")
    print(f"   Username: {user_info.get('username', 'N/A')}")
    print(f"   Hábitos: {len(user_data.get('habits', []))}")
    print(f"   Eventos: {len(user_data.get('events', []))}")
    print(f"   XP: {user_data.get('profile', {}).get('totalXP', 0)}")
    print()
    
    # Importar dados
    try:
        response = requests.post(
            f"{PRODUCTION_URL}/api/sync/import",
            json={
                "secret": SYNC_SECRET,
                "email": USER_EMAIL,
                "data": user_data,
                "user_info": user_info
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Dados importados com sucesso!")
            print(f"   User ID: {result.get('user_id')}")
            print(f"   Username: {result.get('username')}")
            print(f"   Hábitos: {result.get('habits')}")
            print(f"   Eventos: {result.get('events')}")
            return True
        else:
            print(f"❌ Erro ao importar: {response.status_code}")
            print(f"   {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return False

def setup_password():
    """Configura senha para o usuário (caso seja conta Google-only)."""
    print()
    print("🔑 Configurando senha para login com email...")
    
    try:
        response = requests.post(
            f"{PRODUCTION_URL}/api/sync/setup-password",
            json={
                "secret": SYNC_SECRET,
                "email": USER_EMAIL,
                "data": {"password": DEFAULT_PASSWORD}
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✅ Senha configurada: {DEFAULT_PASSWORD}")
            return True
        else:
            print(f"⚠️ Não foi possível configurar senha: {response.text}")
            return False
    except Exception as e:
        print(f"⚠️ Erro ao configurar senha: {e}")
        return False

def verify_login():
    """Verifica se o login funciona."""
    print()
    print("🔐 Verificando login...")
    
    try:
        response = requests.post(
            f"{PRODUCTION_URL}/api/auth/login-email",
            json={"email": USER_EMAIL, "password": DEFAULT_PASSWORD},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login funcionando!")
            print(f"   Username: {data['user']['username']}")
            
            # Verificar dados
            token = data['token']
            data_resp = requests.get(
                f"{PRODUCTION_URL}/api/data",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10
            )
            
            if data_resp.status_code == 200:
                user_data = data_resp.json().get('data', {})
                print(f"   Hábitos: {len(user_data.get('habits', []))}")
                print(f"   Eventos: {len(user_data.get('events', []))}")
                print(f"   XP: {user_data.get('profile', {}).get('totalXP', 0)}")
            return True
        else:
            print(f"❌ Login falhou: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erro ao verificar login: {e}")
        return False

def main():
    print("=" * 50)
    print("  SINCRONIZAÇÃO DE DADOS PARA PRODUÇÃO")
    print("=" * 50)
    print()
    
    # 1. Sincronizar dados
    if not sync_data():
        return
    
    # 2. Configurar senha
    setup_password()
    
    # 3. Verificar login
    verify_login()
    
    print()
    print("=" * 50)
    print("  CONCLUÍDO!")
    print("=" * 50)
    print()
    print("👉 Agora você pode fazer login em:")
    print(f"   https://routine-tracker.com")
    print()
    print("   Com EMAIL:")
    print(f"     Email: {USER_EMAIL}")
    print(f"     Senha: {DEFAULT_PASSWORD}")
    print()
    print("   Ou com GOOGLE:")
    print(f"     Use sua conta Google ({USER_EMAIL})")
    print()

if __name__ == "__main__":
    main()
