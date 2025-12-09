# 📧 Configurar Email no Radar

## 📝 Situação Atual

Atualmente, **os emails não estão a ser enviados** porque as credenciais de email não estão configuradas.

Quando tentas recuperar a password ou criar conta, **o link aparece nos logs da consola**, mas nenhum email é realmente enviado.

---

## ⚠️ Como Ver os Links nos Logs (Temporário)

Enquanto o email não estiver configurado, podes ver os links de reset de password nos logs do servidor:

1. Vai ao terminal onde está `npm run dev`
2. Procura por `[Email] Would send email:`
3. Copia o link que aparece

---

## ✅ Configurar Gmail (Recomendado)

### Passo 1: Criar App Password

1. Vai a [Google Account Settings](https://myaccount.google.com/)
2. Navega para **Security** → **2-Step Verification**
3. Ativa verificação em 2 passos (se ainda não estiver ativa)
4. Voltar a **Security** → **App Passwords**
5. Seleciona:
   - **App:** Mail
   - **Device:** Other (escreve "Radar")
6. Clica **Generate**
7. **Copia a password de 16 caracteres** (sem espaços)

### Passo 2: Adicionar ao `.env`

Cria ou edita o ficheiro `.env` na raiz do projeto:

```bash
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=teu-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  # Cole aqui a App Password
EMAIL_FROM="Radar <noreply@radar.com>"

# Optional: Production URL
APP_URL=http://localhost:5173
```

⚠️ **IMPORTANTE:** Usa a **App Password**, não a tua password normal do Gmail!

### Passo 3: Reiniciar o Servidor

```bash
# Parar o servidor atual (Ctrl+C)
# Depois:
npm run dev
```

---

## 🔧 Outras Opções de Email

### Outlook/Hotmail

```bash
EMAIL_SERVICE=hotmail
EMAIL_USER=teu-email@outlook.com
EMAIL_PASS=tua-password
```

### SendGrid (Produção)

```bash
EMAIL_SERVICE=SendGrid
EMAIL_USER=apikey
EMAIL_PASS=SG.xxxxxxxxxxxxxxxxxx  # API Key da SendGrid
```

### SMTP Personalizado

```bash
EMAIL_SERVICE=
EMAIL_HOST=smtp.teu-servidor.com
EMAIL_PORT=587
EMAIL_USER=user@example.com
EMAIL_PASS=tua-password
EMAIL_SECURE=false  # true para porta 465
```

---

## 🧪 Testar Email

1. Configura o `.env`
2. Reinicia servidor
3. Tenta **recuperar password** ou **criar conta**
4. Verifica a caixa de entrada (e spam!)

Se vires no terminal:
```
[Email] Email service configured successfully
[Email] Message sent: <message-id>
```

✅ **Está a funcionar!**

---

## 🎯 Emails Enviados

O Radar envia emails em 2 situações:

1. **🎉 Boas-vindas** - Quando crias uma conta nova
2. **🔐 Recuperação de Password** - Quando esqueces a password

Ambos têm templates bonitos em HTML!

---

## 🐛 Troubleshooting

**Email não chega:**
- Verifica pasta de spam
- Confirma que App Password está certa
- Verifica que 2FA está ativo no Google
- Tenta outro email

**Erro "Invalid login":**
- Estás a usar App Password (não password normal)?
- App Password tem espaços? Remove-os!

**Erro "EAUTH":**
- Verifica EMAIL_USER e EMAIL_PASS no `.env`
- Reinicia o servidor

---

## 📝 Exemplo Completo `.env`

```bash
# Database (opcional)
DATABASE_URL=

# OpenAI (para AI reports)
OPENAI_API_KEY=sk-...

# Email (OBRIGATÓRIO para emails)
EMAIL_SERVICE=gmail
EMAIL_USER=radar.app@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM="Radar <noreply@radar.com>"

# Google Places API
VITE_GOOGLE_PLACES_API_KEY=AIza...

# App URL (produção)
APP_URL=http://localhost:5173
```

---

## 🚀 Modo Desenvolvimento (Fallback)

Se não configurares, os emails aparecem **apenas nos logs**:

```
[Email] Would send email: {
  to: 'user@example.com',
  subject: 'Recuperação de Password',
  preview: '...'
}
```

Isto é útil para **desenvolvimento local**, mas **não funciona em produção**!
