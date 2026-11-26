import { test, expect, type Page } from '@playwright/test';

const URL = 'https://demo.playwright.dev/todomvc/';

// Her test Playwright'ın yeni bağlamında (temiz localStorage) çalışır; testler bağımsızdır.
test.beforeEach(async ({ page }) => {
  await page.goto(URL);
});

const newTodo = (page: Page) => page.getByPlaceholder('What needs to be done?');
const items = (page: Page) => page.locator('.todo-list li');
const counter = (page: Page) => page.locator('.todo-count');

async function addTodos(page: Page, ...titles: string[]) {
  for (const title of titles) {
    await newTodo(page).fill(title);
    await newTodo(page).press('Enter');
  }
  await expect(items(page)).toHaveCount(titles.length);
}

const itemByTitle = (page: Page, title: string) =>
  items(page).filter({ has: page.getByText(title, { exact: true }) });

// ---------------------------------------------------------------- Başlangıç
test.describe('Başlangıç durumu', () => {
  test('S0.1 ilk açılışta giriş odakta, liste ve footer yok', async ({ page }) => {
    await expect(newTodo(page)).toBeFocused();
    await expect(items(page)).toHaveCount(0);
    await expect(page.locator('.footer')).toHaveCount(0);
    await expect(page.locator('.main')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------- Ekleme
test.describe('Görev ekleme', () => {
  test('A1 görev eklenir, giriş temizlenir ve odakta kalır', async ({ page }) => {
    await newTodo(page).fill('Buy milk');
    await newTodo(page).press('Enter');

    await expect(items(page)).toHaveText(['Buy milk']);
    await expect(newTodo(page)).toBeEmpty();
    await expect(newTodo(page)).toBeFocused();
    await expect(counter(page)).toHaveText('1 item left');
  });

  test('A2 birden fazla görev eklenme sırasıyla listelenir', async ({ page }) => {
    await addTodos(page, 'bir', 'iki', 'üç');
    await expect(items(page)).toHaveText(['bir', 'iki', 'üç']);
    await expect(counter(page)).toHaveText('3 items left');
  });

  test('A3 özel karakter, HTML ve emoji düz metin olarak gösterilir', async ({ page }) => {
    const text = '<b>bold</b> & "q" 😀 ğüşiöç';
    await addTodos(page, text);
    await expect(items(page).first().locator('label')).toHaveText(text);
    await expect(items(page).first().locator('b')).toHaveCount(0);
  });

  test('A4 HTML enjeksiyonu script çalıştırmaz', async ({ page }) => {
    await page.evaluate(() => ((window as any).__xss = 0));
    await addTodos(page, '<img src=x onerror="window.__xss=1">');
    await expect(items(page).first().locator('img')).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).__xss)).toBe(0);
  });

  test('A5 boş girişte Enter görev eklemez', async ({ page }) => {
    await newTodo(page).press('Enter');
    await expect(items(page)).toHaveCount(0);
    await expect(page.locator('.footer')).toHaveCount(0);
  });

  test('A6 yalnızca boşluk girişi görev eklemez', async ({ page }) => {
    await newTodo(page).fill('   ');
    await newTodo(page).press('Enter');
    await expect(items(page)).toHaveCount(0);
  });

  test('A7 baştaki ve sondaki boşluklar kırpılır', async ({ page }) => {
    await newTodo(page).fill('   padded   ');
    await newTodo(page).press('Enter');
    await expect(items(page)).toHaveText(['padded']);
  });

  test('A11 tek görevde sayaç tekil yazılır', async ({ page }) => {
    await addTodos(page, 'tek');
    await expect(counter(page)).toHaveText('1 item left');
  });
});

// ---------------------------------------------------------------- Tamamlama
test.describe('Tamamlama', () => {
  test('C1 görev tamamlanır: completed sınıfı, sayaç ve Clear completed', async ({ page }) => {
    await addTodos(page, 'a', 'b');
    await items(page).first().getByRole('checkbox', { name: 'Toggle Todo' }).check();

    await expect(items(page).first()).toHaveClass(/completed/);
    await expect(counter(page)).toHaveText('1 item left');
    await expect(page.getByRole('button', { name: 'Clear completed' })).toBeVisible();
  });

  test('C2 işaret geri alınınca görev yeniden aktif olur', async ({ page }) => {
    await addTodos(page, 'a', 'b');
    const box = items(page).first().getByRole('checkbox', { name: 'Toggle Todo' });
    await box.check();
    await box.uncheck();

    await expect(items(page).first()).not.toHaveClass(/completed/);
    await expect(counter(page)).toHaveText('2 items left');
    await expect(page.getByRole('button', { name: 'Clear completed' })).toBeHidden();
  });

  test('C3 Mark all as complete hepsini tamamlar', async ({ page }) => {
    await addTodos(page, 'a', 'b', 'c');
    await page.getByLabel('Mark all as complete').check();

    await expect(page.locator('.todo-list li.completed')).toHaveCount(3);
    await expect(counter(page)).toHaveText('0 items left');
  });

  test('C4 Mark all ikinci kez hepsini yeniden aktif yapar', async ({ page }) => {
    await addTodos(page, 'a', 'b');
    const all = page.getByLabel('Mark all as complete');
    await all.check();
    await all.uncheck();

    await expect(page.locator('.todo-list li.completed')).toHaveCount(0);
    await expect(counter(page)).toHaveText('2 items left');
  });

  test('C5 tüm görevler tek tek tamamlanınca Mark all işaretlenir', async ({ page }) => {
    await addTodos(page, 'a', 'b');
    await items(page).nth(0).getByRole('checkbox').check();
    await items(page).nth(1).getByRole('checkbox').check();
    await expect(page.getByLabel('Mark all as complete')).toBeChecked();
  });

  test('C6 hepsi tamamken biri açılınca Mark all işaretsiz olur', async ({ page }) => {
    await addTodos(page, 'a', 'b');
    await page.getByLabel('Mark all as complete').check();
    await items(page).first().getByRole('checkbox').uncheck();
    await expect(page.getByLabel('Mark all as complete')).not.toBeChecked();
  });

  test('C7 Active filtresinde tamamlanan görev listeden kalkar', async ({ page }) => {
    await addTodos(page, 'a', 'b');
    await page.getByRole('link', { name: 'Active' }).click();
    // check() burada kullanılamaz: öğe kalkınca durum doğrulaması başarısız olur.
    await items(page).first().getByRole('checkbox').click();

    await expect(items(page)).toHaveText(['b']);
    await expect(counter(page)).toHaveText('1 item left');
  });
});

// ---------------------------------------------------------------- Silme
test.describe('Silme', () => {
  test('D1 Delete butonu görevi siler', async ({ page }) => {
    await addTodos(page, 'a', 'b');
    await itemByTitle(page, 'a').hover();
    await itemByTitle(page, 'a').getByRole('button', { name: 'Delete' }).click();

    await expect(items(page)).toHaveText(['b']);
    await expect(counter(page)).toHaveText('1 item left');
  });

  test('D2 tamamlanmış görev silinince aktif sayaç değişmez', async ({ page }) => {
    await addTodos(page, 'a', 'b');
    await itemByTitle(page, 'a').getByRole('checkbox').check();
    await itemByTitle(page, 'a').hover();
    await itemByTitle(page, 'a').getByRole('button', { name: 'Delete' }).click();

    await expect(items(page)).toHaveText(['b']);
    await expect(counter(page)).toHaveText('1 item left');
    await expect(page.getByRole('button', { name: 'Clear completed' })).toBeHidden();
  });

  test('D3 Clear completed yalnızca tamamlananları siler', async ({ page }) => {
    await addTodos(page, 'a', 'b', 'c');
    await itemByTitle(page, 'a').getByRole('checkbox').check();
    await itemByTitle(page, 'c').getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Clear completed' }).click();

    await expect(items(page)).toHaveText(['b']);
    await expect(page.getByRole('button', { name: 'Clear completed' })).toBeHidden();
  });

  test('D4 son görev silinince main ve footer kalkar', async ({ page }) => {
    await addTodos(page, 'a');
    await items(page).first().hover();
    await items(page).first().getByRole('button', { name: 'Delete' }).click();

    await expect(items(page)).toHaveCount(0);
    await expect(page.locator('.main')).toHaveCount(0);
    await expect(page.locator('.footer')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------- Düzenleme
test.describe('Düzenleme', () => {
  async function startEdit(page: Page, title: string) {
    const item = itemByTitle(page, title);
    await item.locator('label').dblclick();
    const edit = item.locator('.edit');
    await expect(item).toHaveClass(/editing/);
    return { item, edit };
  }

  test('E1 çift tık düzenleme modunu mevcut metinle açar', async ({ page }) => {
    await addTodos(page, 'A');
    const { edit } = await startEdit(page, 'A');
    await expect(edit).toHaveValue('A');
    await expect(edit).toBeFocused();
  });

  test('E2 Enter değişikliği kaydeder', async ({ page }) => {
    await addTodos(page, 'A', 'B');
    const { edit } = await startEdit(page, 'A');
    await edit.fill('Edited');
    await edit.press('Enter');
    await expect(items(page)).toHaveText(['Edited', 'B']);
  });

  test('E3 Escape değişikliği iptal eder', async ({ page }) => {
    await addTodos(page, 'A');
    const { edit } = await startEdit(page, 'A');
    await edit.fill('Cancelled');
    await edit.press('Escape');
    await expect(items(page)).toHaveText(['A']);
    await expect(items(page).first()).not.toHaveClass(/editing/);
  });

  test('E4 odak kaybı değişikliği kaydeder', async ({ page }) => {
    await addTodos(page, 'A');
    const { edit } = await startEdit(page, 'A');
    await edit.fill('Blur saved');
    await edit.blur();
    await expect(items(page)).toHaveText(['Blur saved']);
  });

  test('E5 metni boşaltıp Enter görevi siler', async ({ page }) => {
    await addTodos(page, 'A', 'B');
    const { edit } = await startEdit(page, 'A');
    await edit.fill('');
    await edit.press('Enter');
    await expect(items(page)).toHaveText(['B']);
    await expect(counter(page)).toHaveText('1 item left');
  });

  test('E6 düzenlenen metin kırpılır', async ({ page }) => {
    await addTodos(page, 'A');
    const { edit } = await startEdit(page, 'A');
    await edit.fill('  Edited  ');
    await edit.press('Enter');
    await expect(items(page)).toHaveText(['Edited']);
  });
});

// ---------------------------------------------------------------- Filtreleme
test.describe('Filtreleme ve yönlendirme', () => {
  // a (aktif), b (tamamlanmış), c (aktif)
  async function seed(page: Page) {
    await addTodos(page, 'a', 'b', 'c');
    await itemByTitle(page, 'b').getByRole('checkbox').check();
  }

  test('F1 Active yalnızca aktif görevleri gösterir', async ({ page }) => {
    await seed(page);
    await page.getByRole('link', { name: 'Active' }).click();
    await expect(page).toHaveURL(/#\/active$/);
    await expect(items(page)).toHaveText(['a', 'c']);
    await expect(page.getByRole('link', { name: 'Active' })).toHaveClass(/selected/);
  });

  test('F2 Completed yalnızca tamamlananları gösterir', async ({ page }) => {
    await seed(page);
    await page.getByRole('link', { name: 'Completed' }).click();
    await expect(page).toHaveURL(/#\/completed$/);
    await expect(items(page)).toHaveText(['b']);
    await expect(page.getByRole('link', { name: 'Completed' })).toHaveClass(/selected/);
  });

  test('F3 All tüm görevleri gösterir', async ({ page }) => {
    await seed(page);
    await page.getByRole('link', { name: 'Completed' }).click();
    await page.getByRole('link', { name: 'All', exact: true }).click();
    await expect(items(page)).toHaveText(['a', 'b', 'c']);
    await expect(page.getByRole('link', { name: 'All', exact: true })).toHaveClass(/selected/);
  });

  test('F4 doğrudan #/completed adresi filtreyi uygular', async ({ page }) => {
    await seed(page);
    await page.goto(`${URL}#/completed`);
    await expect(items(page)).toHaveText(['b']);
    await expect(page.getByRole('link', { name: 'Completed' })).toHaveClass(/selected/);
  });

  test('F5 yenilemeden sonra görevler ve durumları korunur', async ({ page }) => {
    await seed(page);
    await page.reload();
    await expect(items(page)).toHaveText(['a', 'b', 'c']);
    await expect(itemByTitle(page, 'b')).toHaveClass(/completed/);
    await expect(counter(page)).toHaveText('2 items left');
  });

  test('F6 tamamlanan yokken Completed boş liste ve görünür footer', async ({ page }) => {
    await addTodos(page, 'a');
    await page.getByRole('link', { name: 'Completed' }).click();
    await expect(items(page)).toHaveCount(0);
    await expect(page.locator('.footer')).toBeVisible();
  });

  test('F8 sayaç filtreden bağımsız aktif görev sayısını gösterir', async ({ page }) => {
    await seed(page);
    for (const name of ['Active', 'Completed']) {
      await page.getByRole('link', { name }).click();
      await expect(counter(page)).toHaveText('2 items left');
    }
    await page.getByRole('link', { name: 'All', exact: true }).click();
    await expect(counter(page)).toHaveText('2 items left');
  });
});
