#!/usr/bin/env python3
"""Rebuild tech-day-kiosk/index.html from src/template.html.

Inlines the logo, badges, PCB background, QR code and the animation scripts so the
result is a single offline file. Animations are taken from tech-day-kiosk/animations/
first (kiosk-only ones) and otherwise from the site's animations/ folder.

    python3 tech-day-kiosk/src/build.py
"""
import base64, os, re

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # tech-day-kiosk/
ROOT = os.path.dirname(HERE)                                         # astemes-site/
LOGO = os.path.join(ROOT, 'brand_assets', 'Logo')

def uri(path, mime):
    with open(path, 'rb') as f:
        return 'data:%s;base64,%s' % (mime, base64.b64encode(f.read()).decode())

with open(os.path.join(HERE, 'src', 'template.html'), encoding='utf-8') as f:
    html = f.read()

assets = {
    '__PCB__':   uri(os.path.join(ROOT, 'graphics', 'pcb-bg.svg'), 'image/svg+xml'),
    '__LOGO__':  uri(os.path.join(LOGO, 'Logo_alphasigma_white.png'), 'image/png'),
    '__B_NIP__': uri(os.path.join(LOGO, '3rd Party', 'NI_Partner_Badges_RGB_Consultant_Integration_Partner.png'), 'image/png'),
    '__B_CLA__': uri(os.path.join(LOGO, '3rd Party', 'CLA_2.png'), 'image/png'),
    '__B_CTD__': uri(os.path.join(LOGO, '3rd Party', 'CTD.png'), 'image/png'),
    '__B_CHAMP__': uri(os.path.join(LOGO, '3rd Party', 'LV_Champ_Logo.png'), 'image/png'),
    '__B_INST__':  uri(os.path.join(LOGO, '3rd Party', 'NI Instructor.png'), 'image/png'),
    '__QR__':    uri(os.path.join(HERE, 'src', 'qr.svg'), 'image/svg+xml'),
}

def anim_src(name):
    for d in (os.path.join(HERE, 'animations'), os.path.join(ROOT, 'animations')):
        p = os.path.join(d, name + '.js')
        if os.path.exists(p):
            with open(p, encoding='utf-8') as f:
                return f.read().replace('</script', '<\\/script')
    raise SystemExit('animation not found: ' + name)

used = sorted(set(re.findall(r'data-anim="([^"]+)"', html)))
assets['__ANIMS__'] = ''.join('<script>\n/* animations/%s.js */\n%s\n</script>\n' % (a, anim_src(a)) for a in used)

for k, v in assets.items():
    html = html.replace(k, v)

out = os.path.join(HERE, 'index.html')
with open(out, 'w', encoding='utf-8') as f:
    f.write(html)
print('wrote %s (%d kB) with animations: %s' % (out, len(html) // 1024, ', '.join(used)))
