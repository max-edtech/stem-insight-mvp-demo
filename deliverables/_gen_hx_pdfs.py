# -*- coding: utf-8 -*-
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

OUT_DIR = r"C:\Users\User\construction-budget\deliverables"
os.makedirs(OUT_DIR, exist_ok=True)

POC_PDF = os.path.join(OUT_DIR, "附件3_豪新建設_PoC一頁摘要_v1.0_2026-04-14.pdf")
MOU_PDF = os.path.join(OUT_DIR, "附件4_豪新建設_MOU草稿_v1.0_2026-04-14.pdf")

font_candidates = [
    (r"C:\Windows\Fonts\msjh.ttc", "MSJH"),
    (r"C:\Windows\Fonts\mingliu.ttc", "MINGLIU"),
    (r"C:\Windows\Fonts\kaiu.ttf", "KAIU"),
]
registered_font = None
for path, name in font_candidates:
    if os.path.exists(path):
        try:
            pdfmetrics.registerFont(TTFont(name, path))
            registered_font = name
            break
        except Exception:
            continue
if not registered_font:
    raise RuntimeError("No suitable CJK font found.")

TODAY = "2026-04-14"
styles = getSampleStyleSheet()
base = ParagraphStyle('Base', parent=styles['Normal'], fontName=registered_font, fontSize=11, leading=17, textColor=colors.HexColor('#1F2937'))
h1 = ParagraphStyle('H1', parent=base, fontSize=18, leading=24, spaceAfter=8, textColor=colors.HexColor('#0F3D73'))
h2 = ParagraphStyle('H2', parent=base, fontSize=12, leading=20, spaceBefore=6, spaceAfter=2, textColor=colors.HexColor('#0F3D73'))
small = ParagraphStyle('Small', parent=base, fontSize=9.5, leading=13, textColor=colors.HexColor('#4B5563'))

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(registered_font, 9)
    canvas.setFillColor(colors.HexColor('#6B7280'))
    canvas.drawString(20*mm, 10*mm, f"版本 v1.0｜日期 {TODAY}")
    canvas.drawRightString(190*mm, 10*mm, f"第 {doc.page} 頁")
    canvas.restoreState()

# POC 一頁摘要
poc_story = [
    Paragraph("豪新建設 × 建案評估決策系統｜PoC 一頁摘要", h1),
    Paragraph("文件編號：HX-POC-SUMMARY-v1.0", small),
    Spacer(1, 3*mm),
]

sections = [
    ("一、PoC 目的", "將既有靜態估算流程升級為動態決策流程，使建案在評估階段即可判斷：是否值得開發、合理利潤區間、主要風險來源。"),
    ("二、PoC 範圍", "1) 建立單案評估頁面（收入／成本／利潤）<br/>2) 納入即時價格參數（鋼筋、關鍵間接成本）<br/>3) 提供風險情境模擬（樂觀／基準／保守）<br/>4) 產出管理層可讀報表（會議決策版）"),
    ("三、預期成果", "1) 報價與試算速度提升<br/>2) 利潤判斷標準化且可追溯<br/>3) 降低單靠經驗估價造成的誤差與溝通成本"),
    ("四、合作模式", "先以首批案場 PoC 驗證，完成後再依雙方共識擴充模組；合作目標為資料價值共創與商業成果落地。"),
    ("五、時程建議（6 週）", "W1 需求確認與資料對齊｜W2-W4 頁面與試算引擎建置｜W5 模擬驗證與報表校正｜W6 簡報驗收與下一階段提案"),
]
for t, b in sections:
    poc_story.append(Paragraph(t, h2))
    poc_story.append(Paragraph(b, base))

meta = Table([
    [Paragraph("提交對象：豪新建設 林總經理", base), Paragraph("提交日期：2026-04-14", base)],
    [Paragraph("提交單位：[你的公司名稱]", base), Paragraph("聯絡人：[你的姓名／職稱]", base)],
], colWidths=[85*mm, 85*mm])
meta.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F3F6FA')),
    ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#CBD5E1')),
    ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
]))
poc_story += [Spacer(1, 3*mm), meta]

SimpleDocTemplate(
    POC_PDF,
    pagesize=A4,
    leftMargin=20*mm,
    rightMargin=20*mm,
    topMargin=18*mm,
    bottomMargin=16*mm,
    title="豪新建設_PoC一頁摘要",
    author="[你的公司名稱]",
).build(poc_story, onFirstPage=footer, onLaterPages=footer)

# MOU 草稿
mou_story = [
    Paragraph("合作備忘錄（MOU）草稿", h1),
    Paragraph("文件編號：HX-MOU-DRAFT-v1.0", small),
    Spacer(1, 2*mm),
    Paragraph("甲方：豪新建設股份有限公司（以下稱甲方）", base),
    Paragraph("乙方：[你的公司名稱]（以下稱乙方）", base),
]

clauses = [
    ("第一條｜合作目的", "雙方同意就「建案評估決策系統」進行 PoC 合作，以提升評估效率、利潤可視化與風險管理能力，作為後續正式合作之依據。"),
    ("第二條｜合作範圍", "乙方提供 PoC 所需之評估頁面、試算邏輯、風險分析與報表輸出；甲方提供必要之專案資料與業務情境回饋，協助驗證模型可行性。"),
    ("第三條｜交付與驗收", "乙方依雙方確認時程完成交付；甲方於交付後約定期間內完成驗收回覆。雙方以可操作頁面、試算結果與簡報成果作為驗收依據。"),
    ("第四條｜費用與付款", "PoC 費用依報價單執行（50,000 或 100,000 方案）。付款條件原則為 40%／40%／20%，實際日期由雙方另行書面確認。"),
    ("第五條｜資料與保密", "雙方就合作期間取得之營運、財務、專案及技術資料，均負保密義務。未經資料提供方書面同意，不得揭露予第三人或作本合作目的外之使用。"),
    ("第六條｜智慧財產", "乙方於合作前即有之方法、模型、程式與框架，其權利仍歸乙方所有。甲方於本合作取得之 PoC 成果，限內部評估與管理使用；正式授權範圍另議。"),
    ("第七條｜引薦與合作激勵", "甲方協助引薦潛在合作對象，若引薦後達成實際成交，乙方提供次期費用折抵（比例另載於報價條件）。"),
    ("第八條｜效期與終止", "本 MOU 自雙方簽署日起生效，有效期六個月；期滿得經雙方同意展延。任一方如有重大違約且經通知未改善，他方得終止合作。"),
    ("第九條｜其他", "本 MOU 為合作意向文件，未盡事宜由雙方本誠信原則另行協議。正式權利義務以後續簽署之正式契約為準。"),
]
for t, b in clauses:
    mou_story.append(Paragraph(t, h2))
    mou_story.append(Paragraph(b, base))

sign = Table([
    [Paragraph("甲方代表：________________________", base), Paragraph("乙方代表：________________________", base)],
    [Paragraph("簽署日期：________________________", base), Paragraph("簽署日期：________________________", base)],
], colWidths=[85*mm, 85*mm])
sign.setStyle(TableStyle([
    ('TOPPADDING', (0,0), (-1,-1), 10),
    ('BOTTOMPADDING', (0,0), (-1,-1), 10),
]))

mou_story += [Spacer(1, 8*mm), sign]

SimpleDocTemplate(
    MOU_PDF,
    pagesize=A4,
    leftMargin=20*mm,
    rightMargin=20*mm,
    topMargin=18*mm,
    bottomMargin=16*mm,
    title="豪新建設_MOU草稿",
    author="[你的公司名稱]",
).build(mou_story, onFirstPage=footer, onLaterPages=footer)

print(POC_PDF)
print(MOU_PDF)
