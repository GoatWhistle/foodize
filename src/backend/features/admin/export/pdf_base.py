from datetime import UTC, datetime, timedelta

from fpdf import FPDF

from shared.i18n import DEFAULT_LANGUAGE, translate

_FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
_FONT_BOLD_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


class _PDF(FPDF):
    _BRAND = (255, 75, 0)
    _HEADER_BG = (20, 20, 30)
    _SECTION_BG = (245, 246, 250)
    _ROW_ALT = (252, 252, 255)
    _BORDER_CLR = (210, 213, 220)
    _TEXT_MUTED = (120, 125, 135)

    def __init__(self, title: str, subtitle: str = "", language: str = DEFAULT_LANGUAGE):
        super().__init__()
        self.add_font("dv", "", _FONT_PATH)
        self.add_font("dv", "B", _FONT_BOLD_PATH)
        self.set_font("dv", "", 10)
        self._title = title
        self._subtitle = subtitle
        self._language = language
        self._row_index = 0
        self.add_page()
        self._draw_header()

    def _draw_header(self) -> None:
        self.set_fill_color(*self._HEADER_BG)
        self.rect(0, 0, self.w, 38, style="F")

        self.set_y(8)
        self.set_text_color(180, 185, 200)
        self.set_font("dv", "", 8)
        self.cell(
            0,
            5,
            translate("reports.pdf.brandLine", self._language),
            new_x="LMARGIN",
            new_y="NEXT",
            align="C",
        )

        self.set_draw_color(*self._BRAND)
        self.set_line_width(0.8)
        mid = self.w / 2
        self.line(mid - 20, self.get_y() + 1, mid + 20, self.get_y() + 1)

        self.set_font("dv", "B", 15)
        self.set_text_color(255, 255, 255)
        self.cell(0, 10, self._title, new_x="LMARGIN", new_y="NEXT", align="C")

        self.set_y(44)
        self.set_text_color(0, 0, 0)
        self.set_draw_color(0, 0, 0)
        self.set_line_width(0.2)

        self.set_font("dv", "", 8)
        self.set_text_color(*self._TEXT_MUTED)
        timestamp = (datetime.now(UTC) + timedelta(hours=3)).strftime(
            translate("reports.common.generatedFormat", self._language)
        )
        self.cell(
            0,
            5,
            translate("reports.pdf.generatedAt", self._language, timestamp=timestamp),
            new_x="LMARGIN",
            new_y="NEXT",
            align="C",
        )
        self.set_text_color(0, 0, 0)
        self.ln(4)

    def footer(self) -> None:
        self.set_y(-14)
        self.set_draw_color(*self._BORDER_CLR)
        self.set_line_width(0.3)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(2)
        self.set_font("dv", "", 7)
        self.set_text_color(*self._TEXT_MUTED)
        self.cell(
            0,
            5,
            translate("reports.pdf.footer", self._language, page=self.page_no()),
            align="C",
        )
        self.set_text_color(0, 0, 0)

    def section(self, label: str) -> None:
        self.ln(2)
        self._row_index = 0
        self.set_fill_color(*self._SECTION_BG)
        self.set_draw_color(*self._BRAND)
        self.set_line_width(0.5)
        self.rect(self.l_margin, self.get_y(), 2.5, 8, style="F")
        self.set_x(self.l_margin + 4)
        self.set_font("dv", "B", 10)
        self.set_text_color(30, 30, 45)
        self.cell(0, 8, label, new_x="LMARGIN", new_y="NEXT", fill=True)
        self.set_text_color(0, 0, 0)
        self.set_draw_color(*self._BORDER_CLR)
        self.set_line_width(0.2)
        self.ln(1)

    def row(self, cells: list[tuple[str, int]], bold: bool = False, header: bool = False) -> None:
        if header:
            self.set_fill_color(50, 55, 75)
            self.set_text_color(255, 255, 255)
            self.set_font("dv", "B", 8)
        elif self._row_index % 2 == 0:
            self.set_fill_color(255, 255, 255)
            self.set_text_color(30, 30, 45)
            self.set_font("dv", "B" if bold else "", 8.5)
        else:
            self.set_fill_color(*self._ROW_ALT)
            self.set_text_color(30, 30, 45)
            self.set_font("dv", "B" if bold else "", 8.5)

        self.set_draw_color(*self._BORDER_CLR)
        for text, width in cells:
            self.cell(width, 7.5, str(text), border=1, fill=True)
        self.ln()

        if not header:
            self._row_index += 1

    def info_row(self, label: str, value: str) -> None:
        self.set_fill_color(*self._SECTION_BG)
        self.set_font("dv", "B", 9)
        self.set_text_color(80, 85, 100)
        self.cell(65, 7, label + ":", border="B", fill=True)
        self.set_font("dv", "", 9)
        self.set_text_color(20, 20, 35)
        self.cell(0, 7, value, new_x="LMARGIN", new_y="NEXT", border="B")
        self.set_text_color(0, 0, 0)
