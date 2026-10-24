# GoodBiz Agri — keyword map

Built from how B2B importers, distributors and sourcing agents actually search for Indian agro commodities
(Google, Bing, Baidu, Yandex, B2B marketplaces, and the questions people ask ChatGPT / Perplexity / AI Overviews).
No paid-tool volumes were used; treat the ordering as editorial judgement, then refine with Search Console data
after launch (Performance → Queries, 3 months).

Rules applied on the site:

- One **primary keyword** per page. It leads the `<title>` (≤ 60 characters, brand last: `… | GoodBiz Agri`),
  appears in the meta description (140–160 characters; Chinese 70–110), the H1 or H1 + opening sentence, and the
  first image's `alt` text.
- **Secondary / long-tail terms** go into the meta keywords tag, H2s, variety names, FAQ questions and alt text —
  only where a sentence reads naturally. No repetition for its own sake.
- Every product page opens with a direct answer sentence: *"GoodBiz Agri exports X (varieties) from (origin) through
  (ports) to (markets)."* — the sentence AI engines quote.
- Removed on purpose and never to be reintroduced: HSN codes, harvest season, minimum order, the South India map,
  "representative image" labels.

Where the text lives: page titles / descriptions / keywords in `src/i18n/ui/<lang>.json` (`meta.*`); product
titles, descriptions, H1s and keywords in `src/content/products-i18n/<lang>/<slug>.yaml` (`seo:` block).

---

## Site-wide / brand

| | |
|---|---|
| Primary | **GoodBiz Agri** (brand) · **agro products exporter India** |
| Secondary | agro commodity exporter Bangalore · agri export company Bengaluru · South Indian agro exporter · Indian food commodities supplier · bulk rice and spices exporter · FOB CFR CIF India exporter |

## Home `/`

| | |
|---|---|
| Primary | **agro products exporter India** |
| Secondary | South Indian rice exporter · spices exporter India · turmeric, ginger and arecanut exporter · jaggery and copra exporter · agro products exporter Bangalore · bulk agro commodities supplier · Indian exporter to 70+ countries |
| Title | Agro Products Exporter India: Rice & Spices \| GoodBiz Agri |

## Products `/products`

| | |
|---|---|
| Primary | **Indian agro export products** |
| Secondary | rice, spices and agro commodities catalogue · Sona Masoori and non-basmati rice · turmeric and dry ginger bulk · betel nut, groundnut kernels, copra · specifications and packing · bulk supplier India |

## About `/about`

| | |
|---|---|
| Primary | **agro export company Bengaluru** |
| Secondary | about GoodBiz Agri · direct sourcing from APMC markets · APEDA / Spices Board registered exporter · quality testing aflatoxin pesticide · South India sourcing network |

## Contact `/contact`

| | |
|---|---|
| Primary | **request a quote — Indian agro exporter** |
| Secondary | FOB CFR CIF price India · rice / spice export price quote · WhatsApp exporter India · bulk order enquiry · samples before order |

## Blog `/blog`

| | |
|---|---|
| Primary | **Indian agro export insights** |
| Secondary | South India commodity market report · turmeric / arecanut price trend · buyer guide Indian rice · how to import from India · export documents India |

---

## Products

| Page | Primary | Secondary / long-tail |
|---|---|---|
| `/products/rice` | **Sona Masoori rice exporter** | South Indian rice exporter · Ponni rice supplier · Kerala Matta rice exporter · Seeraga Samba rice · idli rice bulk · steam Sona Masoori · private label rice India |
| `/products/non-basmati-rice` | **non basmati rice exporter India** | IR64 parboiled rice supplier · IR64 raw rice 5% broken · Swarna rice exporter · IR36 rice · long grain parboiled rice bulk · 25% broken rice West Africa |
| `/products/broken-rice` | **100% broken rice supplier** | broken rice exporter India · parboiled broken rice · sortexed broken rice · broken rice for brewery · broken rice animal feed · broken rice Senegal |
| `/products/jaggery` | **jaggery exporter India** | organic jaggery powder bulk · jaggery blocks / cubes · palm jaggery (karupatti) · gur / panela exporter · Mandya jaggery · private label jaggery |
| `/products/arecanut` | **arecanut exporter India** | betel nut exporter · supari supplier · areca nut chali / kempu · split arecanut · sliced betel nut · Shivamogga arecanut |
| `/products/groundnuts` | **groundnut kernels exporter** | peanut supplier India · bold peanuts 38/42 · Java peanuts 50/60 · blanched peanuts · aflatoxin-tested groundnuts · peanut kernels bulk |
| `/products/coconut-copra` | **copra exporter India** | ball copra Tiptur · milling copra · semi husked coconut exporter · edible copra cups · dried coconut supplier · Pollachi coconut |
| `/products/ginger` | **dry ginger exporter India** | fresh ginger supplier · dried unbleached ginger · bleached ginger · Cochin ginger · Wayanad ginger · whole dried ginger bulk |
| `/products/turmeric` | **turmeric exporter India** | turmeric finger supplier · Erode turmeric · dried turmeric bulk · turmeric powder exporter · Alleppey turmeric high curcumin · Salem turmeric bulb |

---

## Locale notes — natural equivalents buyers type

Write in the language, not a word-for-word copy. Brand, Incoterms and variety names (Sona Masoori, IR64, Erode,
Tiptur, chali/kempu) stay in Latin script because buyers search them that way in every market.

| Locale | Main markets | Natural phrasing used |
|---|---|---|
| **ar** (Gulf, Egypt, North Africa) | UAE, Saudi Arabia, Oman, Egypt | مُصدّر … من الهند · مورد … بالجملة · أرز سونا مسوري · أرز غير بسمتي · كركم أصابع · جوز الأريكا (فوفل / سوباري) · فول سوداني · جوز الهند المجفف (كوبرا) · زنجبيل مجفف · سكر الجاغري / الدبس الهندي |
| **fr** (West & North Africa, EU) | Senegal, Côte d'Ivoire, Morocco, France | exportateur de … Inde · fournisseur de … en vrac · riz brisé 100 % · riz étuvé IR64 · curcuma en doigts · noix d'arec · arachides décortiquées · coprah · gingembre séché · jaggery / sucre de canne non raffiné |
| **es** (Latin America, Spain) | Mexico, Colombia, Spain | exportador de … de la India · proveedor de … a granel · arroz quebrado · arroz sancochado (parboiled) · cúrcuma en dedos · nuez de areca / betel · maní / cacahuate · copra · jengibre seco · panela / jaggery |
| **pt** (Brazil, Lusophone Africa) | Brazil, Angola, Mozambique | exportador de … da Índia · fornecedor de … a granel · arroz quebrado · arroz parboilizado · cúrcuma / açafrão-da-terra · noz de areca · amendoim em grão · copra · gengibre seco · rapadura / jaggery |
| **ru** (Russia, CIS) | Russia, Kazakhstan, Uzbekistan | экспорт … из Индии · поставщик … оптом · рис Сона Масури · пропаренный рис IR64 · дроблёный рис · куркума корень / порошок · арековый орех (бетель) · арахис ядро · копра · сушёный имбирь · джаггери (тростниковый сахар) |
| **zh** (China, Singapore, Malaysia) | China, Hong Kong, SEA | 印度…出口商 · …供应商 · 批发 · 索纳马索里大米 · 非印度香米 · 碎米 · 姜黄（姜黄根、姜黄粉） · 槟榔（槟榔干果） · 花生仁 · 椰干 · 干姜 · 印度黑糖（粗糖） |
| **id** (Indonesia, Malaysia) | Indonesia, Malaysia | eksportir … India · pemasok … curah · beras patah · beras parboiled · kunyit kering / bubuk kunyit · pinang (biji pinang) · kacang tanah kupas · kopra · jahe kering · gula aren / gula merah (jaggery) |
| **de** (DACH, EU importers) | Germany, Austria, Netherlands | … Exporteur Indien · … Lieferant · Großhandel / lose Ware · Bruchreis · Parboiled-Reis IR64 · Kurkuma Finger / Pulver · Betelnuss / Arekanuss · Erdnusskerne · Kopra · getrockneter Ingwer · Jaggery (Vollrohrzucker) |

## Measuring

- Search Console → Performance: filter by page, watch impressions for the primary keyword before clicks.
- Bing Webmaster Tools → Search Performance (also feeds ChatGPT search and Copilot).
- Ask ChatGPT / Perplexity monthly: "Who exports Sona Masoori rice from India?", "arecanut exporter Karnataka",
  "Tiptur ball copra supplier" — note whether GoodBiz Agri is cited and which page.
