from PIL import Image, ImageDraw, ImageFont

W, H = 1024, 500
CREAM = (250, 246, 239)
TEAL_DARK = (26, 90, 82)
TEAL_MID = (47, 125, 111)
GREY = (108, 122, 118)

SRC = "/Users/fionabecker/Documents/encopresis-tracker/frontend/assets/images/adaptive-icon.png"

canvas = Image.new("RGB", (W, H), CREAM)

# Mark: adaptive-icon is transparent with generous safe-zone padding.
# Crop to the actual ink before scaling so it doesn't look tiny.
mark = Image.open(SRC).convert("RGBA")
bbox = mark.getbbox()
if bbox:
    mark = mark.crop(bbox)

target_h = 300
scale = target_h / mark.height
mark = mark.resize((max(1, round(mark.width * scale)), target_h), Image.LANCZOS)

mark_x = 86
mark_y = (H - mark.height) // 2
canvas.paste(mark, (mark_x, mark_y), mark)


def font(size, bold=False):
    # Avenir Next.ttc index 0 renders as Demi, which is too heavy for body text,
    # so take the subtitle from HelveticaNeue regular instead.
    candidates = (
        ["/System/Library/Fonts/Supplemental/Avenir Next.ttc"]
        if bold
        else ["/System/Library/Fonts/HelveticaNeue.ttc", "/System/Library/Fonts/Helvetica.ttc"]
    )
    for path in candidates:
        try:
            return ImageFont.truetype(path, size, index=0)
        except Exception:
            continue
    return ImageFont.load_default()


draw = ImageDraw.Draw(canvas)
text_x = mark_x + mark.width + 72

title_f = font(74, bold=True)
sub_f = font(33)

title_1, title_2 = "The Encopresis", "Tracker"
sub_1 = "Track the daily detail."
sub_2 = "Export it for the doctor."

# Lay the block out from its true measured height so it sits optically centered.
lines = [
    (title_1, title_f, TEAL_DARK, 28),
    (title_2, title_f, TEAL_DARK, 40),
    (sub_1, sub_f, TEAL_MID, 16),
    (sub_2, sub_f, GREY, 0),
]
total = sum(
    draw.textbbox((0, 0), t, font=f)[3] - draw.textbbox((0, 0), t, font=f)[1] + gap
    for t, f, _, gap in lines
)

y = (H - total) // 2
for text, f, color, gap in lines:
    bb = draw.textbbox((0, 0), text, font=f)
    draw.text((text_x - bb[0], y - bb[1]), text, font=f, fill=color)
    y += (bb[3] - bb[1]) + gap

out = "/tmp/play-feature-graphic-1024x500.png"
canvas.save(out, "PNG")
print("wrote", out, canvas.size)
