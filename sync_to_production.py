#!/usr/bin/env python3
"""
Script para sincronizar dados do usuário Rafael para produção.

Uso:
    python3 sync_to_production.py

Este script importa os dados exportados do rafael para o ambiente de produção.
Se o usuário não existir, ele será criado automaticamente.
"""

import requests
import json
import os

# Configuração
PRODUCTION_URL = "https://routine-tracker.com"
SYNC_SECRET = "routine_sync_2026_secret"  # Deve ser o mesmo do backend
USER_EMAIL = "ferreira.rafah@gmail.com"
DATA_FILE = "data/rafael_export.json"

def main():
    print("🔄 Sincronizando dados para produção...")
    print(f"   URL: {PRODUCTION_URL}")
    print(f"   Email: {USER_EMAIL}")
    print()
    
    # Carregar dados exportados
    if not os.path.exists(DATA_FILE):
        print(f"❌ Arquivo {DATA_FILE} não encontrado!")
        return
    
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
    
    # Enviar para produção
    try:
        response = requests.post(
            f"{PRODUCTION_URL}/api/sync/import",
            json={
                "secret": SYNC_SECRET,
                "email": USER_EMAIL,
                "data": user_data,
                "user_info": user_info  # Inclui info do user para criar se não existir
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Sincronização concluída!")
            print(f"   {result.get('message')}")
            print(f"   Username: {result.get('username')}")
            print(f"   Hábitos: {result.get('habits')}")
            print(f"   Eventos: {result.get('events')}")
            print()
            print("👉 Agora faça login em https://routine-tracker.com")
            print("   Email: ferreira.rafah@gmail.com")
            print("   Senha: admin")
            print()
            print("   Ou use o login com Google!")
        elif response.status_code == 404:
            print("❌ Endpoint não encontrado em produção!")
            print("   Faça deploy primeiro usando 'Save to GitHub' na Emergent.")
        elif response.status_code == 403:
            print("❌ Secret inválido!")
        else:
            print(f"❌ Erro: {response.status_code}")
            print(f"   {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro de conexão: {e}")
        print("   Verifique se o site está no ar.")

if __name__ == "__main__":
    main()
