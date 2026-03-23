#!/usr/bin/env python3
"""
Script para diagnosticar problemas de conta no ambiente de produção.
Execute este script para verificar o estado da conta do usuário.
"""

import requests
import sys

# Configuração
PRODUCTION_URL = "https://routine-tracker.com"
SYNC_SECRET = "routine_sync_2026_secret"
EMAIL = "ferreira.rafah@gmail.com"

def diagnose():
    print(f"🔍 Diagnosticando conta para: {EMAIL}")
    print(f"📡 Conectando a: {PRODUCTION_URL}")
    print("-" * 50)
    
    try:
        # 1. Testar se a API está acessível
        health_url = f"{PRODUCTION_URL}/api/health"
        print(f"\n1. Testando conexão com API...")
        health_resp = requests.get(health_url, timeout=10)
        if health_resp.status_code == 200:
            print(f"   ✅ API está online: {health_resp.json()}")
        else:
            print(f"   ❌ API retornou erro: {health_resp.status_code}")
            return
        
        # 2. Diagnosticar conta
        diag_url = f"{PRODUCTION_URL}/api/sync/diagnose"
        print(f"\n2. Buscando informações da conta...")
        diag_resp = requests.get(diag_url, params={
            'email': EMAIL,
            'secret': SYNC_SECRET
        }, timeout=10)
        
        if diag_resp.status_code == 200:
            data = diag_resp.json()
            
            print(f"\n📊 Resultado do Diagnóstico:")
            print(f"   Email pesquisado: {data['email_searched']}")
            print(f"   Usuários encontrados: {data['summary']['total_users_found']}")
            print(f"   Documentos de dados: {data['summary']['total_data_docs']}")
            
            if data['users_found']:
                print(f"\n👥 Usuários encontrados:")
                for u in data['users_found']:
                    print(f"   - ID: {u['id']}")
                    print(f"     Username: {u['username']}")
                    print(f"     Email: {u.get('email', 'N/A')}")
                    print(f"     Auth Provider: {u.get('auth_provider', 'password')}")
                    print(f"     Google ID: {u.get('google_id', 'N/A')}")
                    print()
            else:
                print(f"\n⚠️  Nenhum usuário encontrado com este email!")
                print(f"   Isso significa que a conta não existe na produção.")
                print(f"   Solução: Execute o script sync_to_production.py para criar a conta.")
            
            if data['user_data_found']:
                print(f"📦 Dados do usuário:")
                for d in data['user_data_found']:
                    print(f"   - User ID: {d['user_id']}")
                    print(f"     Username: {d['username']}")
                    print(f"     Hábitos: {d['habits_count']}")
                    print(f"     Eventos: {d['events_count']}")
                    print(f"     XP Total: {d['total_xp']}")
                    print(f"     Última sync: {d['synced_at']}")
                    print()
            
            print(f"\n💡 Recomendação: {data['summary']['recommendation']}")
            
        elif diag_resp.status_code == 403:
            print(f"   ❌ Acesso negado. Secret inválido.")
        elif diag_resp.status_code == 404:
            print(f"   ⚠️  Endpoint não encontrado. O código mais recente pode não ter sido deployed.")
            print(f"      Certifique-se de fazer deploy do backend com o endpoint /api/sync/diagnose")
        else:
            print(f"   ❌ Erro: {diag_resp.status_code} - {diag_resp.text[:200]}")
            
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Não foi possível conectar a {PRODUCTION_URL}")
        print(f"      Verifique se o domínio está correto e acessível.")
    except Exception as e:
        print(f"   ❌ Erro: {e}")

if __name__ == "__main__":
    diagnose()
