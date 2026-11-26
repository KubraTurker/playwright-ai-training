# TodoMVC Test Planı

- **Uygulama:** https://demo.playwright.dev/todomvc/ (React sürümü)
- **İnceleme tarihi:** 2026-11-26, Playwright MCP ile canlı gözlem
- **Kaynak:** "Beklenen" sütunu resmi TodoMVC davranış şartnamesinden ve genel kullanıcı beklentisinden gelir. "Gözlenen" sütunu MCP ile görülen gerçek davranıştır. Şartnamenin tanımlamadığı durumlar **Belirsiz** olarak işaretlendi ve otomasyonda assert edilmedi.

## Doğrulanan Locator'lar

| Öğe | Locator |
|---|---|
| Yeni görev girişi | `getByPlaceholder('What needs to be done?')` |
| Liste öğeleri | `.todo-list li` (test id yok) |
| Öğe etiketi | `.todo-list li label` |
| Öğe checkbox | `getByRole('checkbox', { name: 'Toggle Todo' })` |
| Silme butonu | `getByRole('button', { name: 'Delete' })` (hover ile görünür) |
| Düzenleme alanı | `.todo-list li .edit` (çift tık ile açılır, `li.editing`) |
| Tümünü tamamla | `getByLabel('Mark all as complete')` |
| Sayaç | `.todo-count` ("1 item left" / "N items left") |
| Filtreler | `getByRole('link', { name: 'All' / 'Active' / 'Completed' })`, seçili olan `a.selected` |
| Tamamlananları temizle | `getByRole('button', { name: 'Clear completed' })` |

Not: Başlangıçta `.main` ve `.footer` DOM'da hiç yoktur. İlk görev eklenince oluşur.

## Başlangıç durumu

| # | Senaryo | Beklenen | Gözlenen | Durum |
|---|---|---|---|---|
| S0.1 | Sayfa ilk açılışı | Giriş alanı odakta, liste yok, footer yok | Giriş alanı odakta, `.main` ve `.footer` DOM'da yok | Uyumlu |

## 1. Görev ekleme

| # | Tür | Senaryo | Beklenen | Gözlenen | Durum |
|---|---|---|---|---|---|
| A1 | Pozitif | "Buy milk" yazıp Enter | Listeye eklenir, giriş temizlenir, odak girişte kalır, sayaç "1 item left" | Aynen | Uyumlu |
| A2 | Pozitif | Art arda 3 görev ekle | Eklenme sırasıyla listelenir, sayaç "3 items left" | Sıra korunuyor, sayaç doğru | Uyumlu |
| A3 | Pozitif | Özel karakter, HTML ve emoji: `<b>bold</b> & "q" 😀 ğüşiöç` | Metin olduğu gibi gösterilir, HTML yorumlanmaz | Düz metin gösterildi, `<b>` elemanı oluşmadı | Uyumlu |
| A4 | Pozitif | `<img src=x onerror=...>` gir | Script çalışmaz | `window.__x` 0 kaldı | Uyumlu |
| A5 | Negatif | Boş girişte Enter | Görev eklenmez | Eklenmedi | Uyumlu |
| A6 | Negatif | Yalnızca boşluk ("   ") + Enter | Görev eklenmez | Eklenmedi | Uyumlu |
| A7 | Sınır | Başta ve sonda boşluklu "   padded   " | Kırpılmış "padded" olarak kaydedilir | "padded" | Uyumlu |
| A8 | Sınır | Aynı metni iki kez ekle | **Belirsiz**: şartname tekrarı tanımlamaz | İkisi de eklendi (tekrar serbest) | Belirsiz |
| A9 | Sınır | 1000 karakterlik metin | **Belirsiz**: şartname azami uzunluk tanımlamaz | 1000 karakter olduğu gibi eklendi, yatay taşma yok | Belirsiz |
| A10 | Sınır | 100 görev ekle | **Belirsiz**: üst sınır tanımlı değil | 100 öğe eklendi, sayaç "101 items left" (önceki öğelerle birlikte), hata yok | Belirsiz |
| A11 | Sınır | Tek görev varken sayaç metni | "1 item left" (tekil) | "1 item left" | Uyumlu |

## 2. Tamamlama

| # | Tür | Senaryo | Beklenen | Gözlenen | Durum |
|---|---|---|---|---|---|
| C1 | Pozitif | Bir görevin checkbox'ını işaretle | `li.completed` olur, sayaç azalır, "Clear completed" görünür | Aynen | Uyumlu |
| C2 | Pozitif | İşareti geri al | `completed` kalkar, sayaç artar, "Clear completed" gizlenir | Aynen | Uyumlu |
| C3 | Pozitif | "Mark all as complete" | Tüm görevler tamamlanır, sayaç "0 items left" | Aynen | Uyumlu |
| C4 | Pozitif | "Mark all" ikinci kez | Hepsi tekrar aktif olur | Aynen | Uyumlu |
| C5 | Sınır | Tüm görevleri tek tek tamamla | "Mark all" kutusu işaretli görünür | İşaretli | Uyumlu |
| C6 | Sınır | Hepsi tamamken birini aç | "Mark all" kutusu işaretsiz olur | İşaretsiz | Uyumlu |
| C7 | Sınır | Active filtresindeyken görevi tamamla | Öğe listeden kalkar, sayaç güncellenir | Öğe kalktı, "1 item left" | Uyumlu |

## 3. Silme

| # | Tür | Senaryo | Beklenen | Gözlenen | Durum |
|---|---|---|---|---|---|
| D1 | Pozitif | Öğenin üzerine gel, Delete (×) tıkla | Öğe silinir, sayaç güncellenir | Aynen | Uyumlu |
| D2 | Pozitif | Tamamlanmış öğeyi sil | Öğe silinir, aktif sayaç değişmez | Sayaç değişmedi | Uyumlu |
| D3 | Pozitif | "Clear completed" | Yalnızca tamamlananlar silinir, buton gizlenir | Aynen | Uyumlu |
| D4 | Sınır | Son kalan öğeyi sil | Liste boşalır, `.main` ve `.footer` kalkar | İkisi de DOM'dan kalktı | Uyumlu |
| D5 | Negatif | Hover olmadan Delete butonu | Gizli olmalı | Hover sonrası görünür (hover öncesi durum ölçülmedi) | Doğrulanmadı |

## 4. Düzenleme

| # | Tür | Senaryo | Beklenen | Gözlenen | Durum |
|---|---|---|---|---|---|
| E1 | Pozitif | Etikete çift tıkla | Düzenleme modu açılır, mevcut metin dolu, odakta | `li.editing`, değer "A", odakta | Uyumlu |
| E2 | Pozitif | Metni değiştir + Enter | Yeni metin kaydedilir | "Edited" | Uyumlu |
| E3 | Pozitif | Düzenlerken Escape | Değişiklik iptal edilir | Eski metin kaldı | Uyumlu |
| E4 | Pozitif | Düzenleyip odağı kaybet (blur) | Değişiklik kaydedilir | Kaydedildi | Uyumlu |
| E5 | Sınır | Metni boşalt + Enter | Görev silinir | Silindi, sayaç güncellendi | Uyumlu |
| E6 | Sınır | Kenarlarda boşluklu metinle kaydet ("  Edited  ") | Kırpılır | "Edited" | Uyumlu |

## 5. Filtreleme ve yönlendirme

| # | Tür | Senaryo | Beklenen | Gözlenen | Durum |
|---|---|---|---|---|---|
| F1 | Pozitif | Active | Yalnızca tamamlanmamışlar, `#/active`, link seçili | Aynen | Uyumlu |
| F2 | Pozitif | Completed | Yalnızca tamamlananlar, `#/completed`, link seçili | Aynen | Uyumlu |
| F3 | Pozitif | All | Hepsi, `#/` | Aynen | Uyumlu |
| F4 | Pozitif | `#/completed` adresine doğrudan git | Filtre uygulanır, "Completed" seçili | Aynen | Uyumlu |
| F5 | Pozitif | Sayfayı yenile | Görevler ve tamamlanma durumu korunur (localStorage) | Aynen | Uyumlu |
| F6 | Sınır | Completed filtresi, hiç tamamlanan yok | Boş liste, footer görünür kalır | Liste boş, footer görünür | Uyumlu |
| F7 | Negatif | Geçersiz yol `#/bogus` | **Belirsiz**: şartname tanımlamaz | Tüm görevler listelendi, bir filtre linki seçili (hangisi ölçülmedi) | Belirsiz |
| F8 | Sınır | Filtre sayacı | Sayaç filtreden bağımsız olarak aktif görev sayısını gösterir | Her filtrede aynı | Uyumlu |

## Test altyapısı notları

- Her test `localStorage` temiz yeni bağlamda çalışır (Playwright varsayılanı), testler birbirinden bağımsızdır.
- Sabit `sleep` yok. Yalnızca otomatik beklemeli `expect(...)` assertion'ları kullanılır. Anlık okuma (`allInnerTexts`) filtre geçişinde bayat veri döndürdü, bu yüzden assertion'larla beklenmeli.
- Active filtresinde `check()` kullanılamaz: öğe kalkınca Playwright durum doğrulamasında zaman aşımına uğrar. `click()` kullanılır.
- Sitedeki tek konsol hatası `favicon.ico` 404'üdür, uygulama hatası değildir.

## Belirsiz beklentiler (otomasyonda assert edilmedi)

A8 (tekrar eden görev), A9 (azami uzunluk), A10 (görev sayısı üst sınırı), F7 (geçersiz rota) ve D5 (Delete butonunun hover öncesi durumu). Ürün sahibinden beklenen davranış netleşince eklenmeli.
