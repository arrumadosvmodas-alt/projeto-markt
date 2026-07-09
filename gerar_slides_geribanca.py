#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GeriBanca TikTok Slides Generator
Gera 12 slides profissionais para TikTok (1080x1920px)
"""

from PIL import Image, ImageDraw, ImageFont
import os
from datetime import datetime

# ============================================================================
# CORES DO GERIBANCA
# ============================================================================
CORES = {
    'fundo': '#0F172A',           # Azul muito escuro
    'roxo': '#7C3AED',            # Roxo primário
    'ciano': '#06B6D4',           # Ciano secundário
    'verde': '#10B981',           # Verde sucesso
    'vermelho': '#EF4444',        # Vermelho alerta
    'branco': '#FFFFFF',          # Branco texto
    'cinza': '#94A3B8',           # Cinza neutro
    'cinza_escuro': '#1E293B',    # Cinza escuro
}

# Converter HEX para RGB
def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

# ============================================================================
# CONFIGURAÇÕES DE FONTE
# ============================================================================
FONT_SIZE_TITULO = 52
FONT_SIZE_GRANDE = 48
FONT_SIZE_NORMAL = 32
FONT_SIZE_PEQUENO = 24
FONT_SIZE_MUITO_PEQUENO = 16

# Tenta usar fontes do sistema, se não existir usa padrão
try:
    font_bold = ImageFont.truetype("arial.ttf", FONT_SIZE_TITULO)
    font_normal = ImageFont.truetype("arial.ttf", FONT_SIZE_NORMAL)
    font_pequeno = ImageFont.truetype("arial.ttf", FONT_SIZE_PEQUENO)
except:
    font_bold = ImageFont.load_default()
    font_normal = ImageFont.load_default()
    font_pequeno = ImageFont.load_default()

# ============================================================================
# CLASSE PARA CRIAR SLIDES
# ============================================================================
class SlideMaker:
    def __init__(self, width=1080, height=1920):
        self.width = width
        self.height = height
        self.slides = []

    def criar_slide_em_branco(self, cor_fundo='#0F172A'):
        """Cria um slide em branco com fundo especificado"""
        img = Image.new('RGB', (self.width, self.height), hex_to_rgb(cor_fundo))
        return img

    def adicionar_retangulo(self, img, x, y, width, height, cor, radius=0):
        """Adiciona um retângulo ao slide"""
        draw = ImageDraw.Draw(img)
        cor_rgb = hex_to_rgb(cor)
        draw.rectangle([x, y, x + width, y + height], fill=cor_rgb)
        return img

    def adicionar_texto(self, img, texto, x, y, tamanho=32, cor='#FFFFFF', alinhamento='center'):
        """Adiciona texto ao slide"""
        draw = ImageDraw.Draw(img)
        cor_rgb = hex_to_rgb(cor)

        # Tenta usar fonte adequada baseado no tamanho
        try:
            if tamanho >= 48:
                font = ImageFont.truetype("arial.ttf", tamanho)
            else:
                font = ImageFont.truetype("arial.ttf", tamanho)
        except:
            font = ImageFont.load_default()

        draw.text((x, y), texto, fill=cor_rgb, font=font, anchor="mm")
        return img

    def adicionar_barra_progresso(self, img, x, y, width, height, percentual, cor_preenchimento, cor_fundo='#1E293B'):
        """Adiciona barra de progresso"""
        draw = ImageDraw.Draw(img)

        # Fundo da barra
        draw.rectangle([x, y, x + width, y + height],
                      fill=hex_to_rgb(cor_fundo), outline=hex_to_rgb(cor_fundo))

        # Preenchimento
        preenchimento = int((width * percentual) / 100)
        draw.rectangle([x, y, x + preenchimento, y + height],
                      fill=hex_to_rgb(cor_preenchimento))

        return img

    def salvar_slide(self, img, numero):
        """Salva o slide como PNG"""
        pasta = r'C:\Projeto Markt\GeribancaTikTok_Slides'
        os.makedirs(pasta, exist_ok=True)
        caminho = os.path.join(pasta, f'Slide_{numero:02d}.png')
        img.save(caminho, 'PNG')
        print(f"✅ Slide {numero} salvo: {caminho}")
        return caminho

# ============================================================================
# GERADOR DE SLIDES
# ============================================================================
def gerar_slides():
    """Gera todos os 12 slides"""
    maker = SlideMaker()

    print("\n" + "="*60)
    print("🎬 GERADOR DE SLIDES GERIBANCA")
    print("="*60 + "\n")

    # ========== SLIDE 1 ==========
    print("Criando Slide 1/12 - Apresentação do Problema...")
    img1 = maker.criar_slide_em_branco()

    # Título principal
    maker.adicionar_texto(img1, "Você Sabe Quanto", 540, 200, 52, CORES['branco'])
    maker.adicionar_texto(img1, "Está Perdendo?", 540, 280, 52, CORES['branco'])

    # Ícones (simulado com símbolos)
    maker.adicionar_texto(img1, "?", 300, 450, 80, CORES['vermelho'])
    maker.adicionar_texto(img1, "?", 540, 450, 80, CORES['vermelho'])
    maker.adicionar_texto(img1, "?", 780, 450, 80, CORES['vermelho'])

    # Dinheiro caindo
    maker.adicionar_texto(img1, "💸", 350, 650, 60, CORES['branco'])
    maker.adicionar_texto(img1, "💸", 730, 750, 60, CORES['branco'])

    # Linha divisora (retângulo fino)
    maker.adicionar_retangulo(img1, 200, 1000, 680, 3, CORES['roxo'])

    # Subtexto
    maker.adicionar_texto(img1, "Controle Total da Banca", 540, 1200, 24, CORES['ciano'])
    maker.adicionar_texto(img1, "Evite Perdas Desnecessárias", 540, 1280, 24, CORES['ciano'])

    maker.salvar_slide(img1, 1)

    # ========== SLIDE 2 ==========
    print("Criando Slide 2/12 - Apresentação da Solução...")
    img2 = maker.criar_slide_em_branco()

    # Logo (quadrado roxo)
    maker.adicionar_retangulo(img2, 440, 200, 200, 200, CORES['roxo'])

    # Círculo ciano dentro
    maker.adicionar_retangulo(img2, 480, 240, 120, 120, CORES['ciano'])

    # Nome GERIBANCA
    maker.adicionar_texto(img2, "GERIBANCA", 540, 550, 64, CORES['roxo'])

    # Tagline
    maker.adicionar_texto(img2, "Não é app de apostas,", 540, 750, 26, CORES['branco'])
    maker.adicionar_texto(img2, "é INTELIGÊNCIA de gestão", 540, 820, 26, CORES['branco'])

    # Decoração (pontos)
    maker.adicionar_texto(img2, "●", 300, 780, 24, CORES['roxo'])
    maker.adicionar_texto(img2, "●", 780, 780, 24, CORES['ciano'])

    maker.salvar_slide(img2, 2)

    # ========== SLIDE 3 ==========
    print("Criando Slide 3/12 - Simulações...")
    img3 = maker.criar_slide_em_branco()

    # Título
    maker.adicionar_texto(img3, "📊 Simule Seus", 540, 150, 48, CORES['branco'])
    maker.adicionar_texto(img3, "Investimentos", 540, 230, 48, CORES['branco'])

    # Caixa 1 - Ganho (verde)
    maker.adicionar_retangulo(img3, 150, 450, 200, 200, CORES['verde'])
    maker.adicionar_texto(img3, "↗️", 250, 520, 60, CORES['branco'])
    maker.adicionar_texto(img3, "Ganho", 250, 600, 20, CORES['branco'])

    # Caixa 2 - Neutro (cinza)
    maker.adicionar_retangulo(img3, 440, 450, 200, 200, CORES['cinza'])
    maker.adicionar_texto(img3, "➡️", 540, 520, 60, CORES['branco'])
    maker.adicionar_texto(img3, "Neutro", 540, 600, 20, CORES['branco'])

    # Caixa 3 - Perda (vermelho)
    maker.adicionar_retangulo(img3, 730, 450, 200, 200, CORES['vermelho'])
    maker.adicionar_texto(img3, "↘️", 830, 520, 60, CORES['branco'])
    maker.adicionar_texto(img3, "Perda", 830, 600, 20, CORES['branco'])

    # Rodapé
    maker.adicionar_texto(img3, "Veja Como Cada Decisão", 540, 1300, 24, CORES['ciano'])
    maker.adicionar_texto(img3, "Afeta Seu Saldo", 540, 1370, 24, CORES['ciano'])

    maker.salvar_slide(img3, 3)

    # ========== SLIDE 4 ==========
    print("Criando Slide 4/12 - Controle de Risco...")
    img4 = maker.criar_slide_em_branco()

    # Ícone
    maker.adicionar_texto(img4, "🛡️", 540, 150, 80, CORES['roxo'])

    # Título
    maker.adicionar_texto(img4, "Controle de Risco", 540, 280, 48, CORES['branco'])

    # Barra de risco (65%)
    maker.adicionar_barra_progresso(img4, 200, 600, 680, 30, 65, CORES['vermelho'])

    # Status
    maker.adicionar_texto(img4, "Risco: MODERADO", 540, 750, 32, CORES['vermelho'])
    maker.adicionar_texto(img4, "5%", 540, 820, 32, CORES['vermelho'])

    # Alerta
    maker.adicionar_retangulo(img4, 150, 1100, 780, 150, CORES['roxo'])
    maker.adicionar_texto(img4, "⚠️ Alerta Ativado", 540, 1150, 24, CORES['branco'])
    maker.adicionar_texto(img4, "Você está próximo do limite", 540, 1220, 22, CORES['branco'])

    maker.salvar_slide(img4, 4)

    # ========== SLIDE 5 ==========
    print("Criando Slide 5/12 - Métricas...")
    img5 = maker.criar_slide_em_branco()

    # Título
    maker.adicionar_texto(img5, "📊 Suas Métricas", 540, 150, 44, CORES['branco'])

    # Card 1 - Taxa de Acerto (roxo)
    maker.adicionar_retangulo(img5, 100, 350, 350, 250, CORES['roxo'])
    maker.adicionar_texto(img5, "Taxa de Acerto", 275, 420, 18, CORES['branco'])
    maker.adicionar_texto(img5, "62.5%", 275, 520, 36, CORES['branco'])

    # Card 2 - ROI (ciano)
    maker.adicionar_retangulo(img5, 630, 350, 350, 250, CORES['ciano'])
    maker.adicionar_texto(img5, "ROI Retorno", 815, 420, 18, CORES['branco'])
    maker.adicionar_texto(img5, "-100.0%", 815, 520, 36, CORES['vermelho'])

    # Card 3 - Rendimento (verde)
    maker.adicionar_retangulo(img5, 100, 700, 350, 250, CORES['verde'])
    maker.adicionar_texto(img5, "Rendimento", 275, 770, 18, CORES['branco'])
    maker.adicionar_texto(img5, "R$8.52", 275, 870, 36, CORES['branco'])

    # Card 4 - Status (roxo)
    maker.adicionar_retangulo(img5, 630, 700, 350, 250, CORES['roxo'])
    maker.adicionar_texto(img5, "Status", 815, 770, 18, CORES['branco'])
    maker.adicionar_texto(img5, "Ativo", 815, 870, 36, CORES['branco'])

    # Rodapé
    maker.adicionar_texto(img5, "Dados Claros para Decisões Melhores", 540, 1500, 24, CORES['ciano'])

    maker.salvar_slide(img5, 5)

    # ========== SLIDE 6 ==========
    print("Criando Slide 6/12 - Planejamento...")
    img6 = maker.criar_slide_em_branco()

    # Título
    maker.adicionar_texto(img6, "📈 Sua Projeção", 540, 150, 40, CORES['branco'])

    # Simulação de tabela com texto
    y_pos = 350
    maker.adicionar_texto(img6, "DIA  |  PROJEÇÃO  |  REALIZADO", 540, y_pos, 18, CORES['roxo'])

    y_pos += 80
    maker.adicionar_texto(img6, "1  |  R$210  |  R$211 ✓", 540, y_pos, 20, CORES['branco'])

    y_pos += 80
    maker.adicionar_texto(img6, "2  |  R$218  |  R$218 ✓", 540, y_pos, 20, CORES['branco'])

    y_pos += 80
    maker.adicionar_texto(img6, "3  |  R$224  |  R$232 ↑", 540, y_pos, 20, CORES['verde'])

    y_pos += 80
    maker.adicionar_texto(img6, "4  |  R$231  |  R$240 ↑↑", 540, y_pos, 20, CORES['verde'])

    # Rodapé
    maker.adicionar_texto(img6, "Entenda Seus Lucros e Perdas", 540, 1500, 24, CORES['ciano'])

    maker.salvar_slide(img6, 6)

    # ========== SLIDE 7 ==========
    print("Criando Slide 7/12 - Interface...")
    img7 = maker.criar_slide_em_branco()

    # Saldo (topo)
    maker.adicionar_texto(img7, "R$ 211,04", 540, 200, 52, CORES['ciano'])
    maker.adicionar_texto(img7, "Saldo Atual", 540, 280, 18, CORES['cinza'])

    # Abas
    maker.adicionar_texto(img7, "Banca  |  Desempenho  |  Simulação", 540, 400, 18, CORES['roxo'])

    # Card de info
    maker.adicionar_retangulo(img7, 100, 550, 880, 250, CORES['cinza_escuro'])
    maker.adicionar_texto(img7, "Saldo Inicial: R$ 206.20", 540, 600, 18, CORES['branco'])
    maker.adicionar_texto(img7, "Meta: R$ 309.30", 540, 670, 18, CORES['branco'])
    maker.adicionar_texto(img7, "Risco: MODERADO (5%)", 540, 740, 18, CORES['branco'])

    # Botão grande
    maker.adicionar_retangulo(img7, 150, 1000, 780, 120, CORES['roxo'])
    maker.adicionar_texto(img7, "+ NOVA APOSTA", 540, 1060, 28, CORES['branco'])

    # Rodapé
    maker.adicionar_texto(img7, "Interface Limpa e Intuitiva", 540, 1500, 24, CORES['ciano'])

    maker.salvar_slide(img7, 7)

    # ========== SLIDE 8 ==========
    print("Criando Slide 8/12 - Profissionalismo...")
    img8 = maker.criar_slide_em_branco()

    # Título
    maker.adicionar_texto(img8, "🎯 PROFISSIONALISMO", 540, 150, 48, CORES['roxo'])

    # Checkmarks
    y = 350
    maker.adicionar_texto(img8, "✓ CONTROLE TOTAL", 540, y, 24, CORES['verde'])
    y += 80
    maker.adicionar_texto(img8, "✓ ESTRATÉGIA DEFINIDA", 540, y, 24, CORES['verde'])
    y += 80
    maker.adicionar_texto(img8, "✓ RESULTADOS CONSISTENTES", 540, y, 24, CORES['verde'])

    # Progress bars
    y = 950
    maker.adicionar_texto(img8, "62% de Acerto", 200, y, 18, CORES['branco'])
    maker.adicionar_barra_progresso(img8, 200, y+50, 680, 20, 62, CORES['ciano'])

    y += 120
    maker.adicionar_texto(img8, "75% de Eficiência", 200, y, 18, CORES['branco'])
    maker.adicionar_barra_progresso(img8, 200, y+50, 680, 20, 75, CORES['verde'])

    y += 120
    maker.adicionar_texto(img8, "100% de Controle", 200, y, 18, CORES['branco'])
    maker.adicionar_barra_progresso(img8, 200, y+50, 680, 20, 100, CORES['roxo'])

    maker.salvar_slide(img8, 8)

    # ========== SLIDE 9 ==========
    print("Criando Slide 9/12 - Redução de Perdas...")
    img9 = maker.criar_slide_em_branco()

    # Título
    maker.adicionar_texto(img9, "🛡️ Minimize Suas Perdas", 540, 150, 44, CORES['branco'])

    # Antes (100% vermelho)
    maker.adicionar_retangulo(img9, 200, 450, 80, 300, CORES['vermelho'])
    maker.adicionar_texto(img9, "ANTES", 240, 850, 20, CORES['branco'])
    maker.adicionar_texto(img9, "100%", 240, 900, 24, CORES['branco'])

    # Seta
    maker.adicionar_texto(img9, "➜", 540, 650, 60, CORES['ciano'])

    # Depois (40% verde)
    maker.adicionar_retangulo(img9, 800, 450, 80, 300, CORES['cinza_escuro'])
    maker.adicionar_retangulo(img9, 800, 570, 80, 180, CORES['verde'])
    maker.adicionar_texto(img9, "AGORA", 840, 850, 20, CORES['branco'])
    maker.adicionar_texto(img9, "40%", 840, 900, 24, CORES['branco'])
    maker.adicionar_texto(img9, "↓ 60% Redução", 540, 950, 18, CORES['roxo'])

    # Checklist
    y = 1200
    maker.adicionar_texto(img9, "✓ Análise Estratégica", 540, y, 18, CORES['verde'])
    y += 70
    maker.adicionar_texto(img9, "✓ Padrões Identificados", 540, y, 18, CORES['verde'])
    y += 70
    maker.adicionar_texto(img9, "✓ Decisões Melhores", 540, y, 18, CORES['verde'])

    maker.salvar_slide(img9, 9)

    # ========== SLIDE 10 ==========
    print("Criando Slide 10/12 - Oferta Grátis...")
    img10 = maker.criar_slide_em_branco()

    # Troféus
    maker.adicionar_texto(img10, "🏆", 250, 150, 60, CORES['branco'])
    maker.adicionar_texto(img10, "🏆", 830, 150, 60, CORES['branco'])

    # Caixa de destaque
    maker.adicionar_retangulo(img10, 100, 350, 880, 500, CORES['cinza_escuro'])

    # Texto principal
    maker.adicionar_texto(img10, "30 DIAS GRÁTIS", 540, 550, 52, CORES['ciano'])
    maker.adicionar_texto(img10, "SEM COMPROMISSO", 540, 650, 52, CORES['ciano'])

    # Descrição
    maker.adicionar_texto(img10, "Acesso Completo a Todos os", 540, 800, 22, CORES['branco'])
    maker.adicionar_texto(img10, "Recursos Premium", 540, 850, 22, CORES['branco'])

    # Botão CTA
    maker.adicionar_retangulo(img10, 200, 1100, 680, 120, CORES['verde'])
    maker.adicionar_texto(img10, "COMECE AGORA", 540, 1160, 28, CORES['branco'])

    # Rodapé
    maker.adicionar_texto(img10, "Primeiros Interessados Receberão", 540, 1600, 16, CORES['ciano'])
    maker.adicionar_texto(img10, "Acesso Imediato", 540, 1650, 16, CORES['ciano'])

    maker.salvar_slide(img10, 10)

    # ========== SLIDE 11 ==========
    print("Criando Slide 11/12 - Instruções...")
    img11 = maker.criar_slide_em_branco()

    # Título
    maker.adicionar_texto(img11, "📋 Como Participar?", 540, 150, 44, CORES['branco'])

    # Passo 1
    maker.adicionar_texto(img11, "1️⃣", 540, 350, 50, CORES['branco'])
    maker.adicionar_retangulo(img11, 100, 450, 880, 180, CORES['roxo'])
    maker.adicionar_texto(img11, "Comente Seu Nome", 540, 500, 20, CORES['branco'])
    maker.adicionar_texto(img11, "[Seu Nome Aqui]", 540, 570, 18, CORES['cinza'])

    # Passo 2
    maker.adicionar_texto(img11, "2️⃣", 540, 750, 50, CORES['branco'])
    maker.adicionar_retangulo(img11, 100, 850, 880, 180, CORES['ciano'])
    maker.adicionar_texto(img11, "Compartilhe Seu Email", 540, 900, 20, CORES['branco'])
    maker.adicionar_texto(img11, "[seu.email@provider.com]", 540, 970, 18, CORES['cinza'])

    # Passo 3
    maker.adicionar_texto(img11, "3️⃣", 540, 1150, 50, CORES['branco'])
    maker.adicionar_retangulo(img11, 100, 1250, 880, 180, CORES['verde'])
    maker.adicionar_texto(img11, "Receba via Google Play", 540, 1300, 20, CORES['branco'])
    maker.adicionar_texto(img11, "📱 Google Play", 540, 1370, 18, CORES['branco'])

    maker.salvar_slide(img11, 11)

    # ========== SLIDE 12 ==========
    print("Criando Slide 12/12 - Fechamento...")
    img12 = maker.criar_slide_em_branco()

    # Título
    maker.adicionar_texto(img12, "Junte-se ao Grupo de", 540, 150, 28, CORES['branco'])
    maker.adicionar_texto(img12, "TESTADORES", 540, 220, 52, CORES['roxo'])

    # Avatares (simulado)
    avatares_x = [250, 350, 450, 550, 650]
    for i, x in enumerate(avatares_x):
        cores_avatar = [CORES['roxo'], CORES['ciano'], CORES['verde'], CORES['vermelho'], CORES['roxo']]
        maker.adicionar_retangulo(img12, x-30, 350, 60, 60, cores_avatar[i])
        maker.adicionar_texto(img12, "👤", x, 380, 30, CORES['branco'])

    # Caixa de participação
    maker.adicionar_retangulo(img12, 50, 600, 980, 600, CORES['cinza_escuro'])

    # Cabeçalho da caixa
    maker.adicionar_retangulo(img12, 100, 650, 880, 80, CORES['roxo'])
    maker.adicionar_texto(img12, "👇 COMENTE ABAIXO 👇", 540, 690, 24, CORES['ciano'])

    # Campos
    maker.adicionar_texto(img12, "NOME: _______________________", 540, 800, 18, CORES['branco'])
    maker.adicionar_texto(img12, "EMAIL: _______________________", 540, 900, 18, CORES['branco'])

    # Mensagem
    maker.adicionar_texto(img12, "Vamos te Incluir!", 540, 1050, 20, CORES['verde'])

    # Rodapé
    maker.adicionar_texto(img12, "❤️ Agradecidos por sua confiança", 540, 1550, 18, CORES['ciano'])

    maker.salvar_slide(img12, 12)

    print("\n" + "="*60)
    print("✅ TODOS OS 12 SLIDES CRIADOS COM SUCESSO!")
    print("="*60)
    print(f"\n📁 Pasta de saída: C:\\Projeto Markt\\GeribancaTikTok_Slides\\")
    print("\n🎬 Próximo passo: Importe os PNGs no CapCut Pro!")
    print("="*60 + "\n")

# ============================================================================
# EXECUTAR
# ============================================================================
if __name__ == "__main__":
    gerar_slides()
