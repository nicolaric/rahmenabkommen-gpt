import os
import xml.etree.ElementTree as ET
from flask import Blueprint, Response
from app.models import Conversation

sitemap_bp = Blueprint('sitemap', __name__)

BASE_URL = os.getenv("BASE_URL", "https://rahmenabkommen-gpt.ch")  # Fallback-URL

@sitemap_bp.route('/sitemap.xml', methods=['GET'])
def sitemap():
    # 1. Alle geteilten Konversationen auslesen
    convs = Conversation.query.filter_by(shared=True) \
                               .order_by(Conversation.creation_date.desc()) \
                               .all()

    # 2. XML-Baum anlegen
    urlset = ET.Element('urlset', xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")

    for path, freq, prio in [
        ('/', 'daily', '1.0'),
        ('/help', 'daily', '0.5'),
    ]:
        url = ET.SubElement(urlset, 'url')
        loc = ET.SubElement(url, 'loc')
        loc.text = f'{BASE_URL}{path}'
        changefreq = ET.SubElement(url, 'changefreq')
        changefreq.text = freq
        priority = ET.SubElement(url, 'priority')
        priority.text = prio

    for conv in convs:
        url = ET.SubElement(urlset, 'url')
        loc = ET.SubElement(url, 'loc')
        loc.text = f'{BASE_URL}/conversations/{conv.id}'

        lastmod = ET.SubElement(url, 'lastmod')
        # ISO‑Datum, z.B. "2025-06-29"
        lastmod.text = conv.creation_date.date().isoformat()

        # optional: changefreq und priority
        changefreq = ET.SubElement(url, 'changefreq')
        changefreq.text = 'monthly'
        priority = ET.SubElement(url, 'priority')
        priority.text = '0.8'

    # 3. Baum in einen String serialisieren
    xml_bytes = ET.tostring(urlset, encoding='utf-8', xml_declaration=True)
    return Response(xml_bytes, mimetype='application/xml')

