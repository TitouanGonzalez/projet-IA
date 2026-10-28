import { test, expect } from '@playwright/test';

const title = 'Nostromo, dossiers de l’équipage';

test('intro : démarrage du terminal, puis entrée sur le site', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: title })).toBeAttached();
  await expect(page.locator('[data-phase="intro"]')).toBeVisible();
  await expect(page.getByText('START BOOTING SYSTEM...')).toBeVisible();
  const enter = page.getByRole('button', { name: 'ENTER' });
  await expect(enter).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-phase="site"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'DÉCOUVRIR' })).toBeVisible();
  await expect(page.locator('.al-card')).toHaveCount(6);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test('fil de fer 3D animé et ouvert au survol du bouton', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER' }).click();
  const egg = page.locator('canvas.al-egg');
  await expect(egg).toBeVisible();
  const first = Number(await egg.getAttribute('data-frames'));
  await page.waitForTimeout(400);
  expect(Number(await egg.getAttribute('data-frames'))).toBeGreaterThan(first);
});

test('cartes : inclinaison 3D, dossier ouvert avec jauges, retour du focus', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER' }).click();
  await page.getByRole('button', { name: 'DÉCOUVRIR' }).click();
  const card = page.locator('.al-card').first();
  await card.scrollIntoViewIfNeeded();
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + box.width - 10, box.y + 10);
  await expect(card).toHaveAttribute('data-tilt', 'on');
  expect(
    await card.evaluate((el) => el.style.getPropertyValue('--ry')),
  ).not.toBe('0deg');
  await card.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole('heading', { name: 'Ellen Ripley' }),
  ).toBeVisible();
  await expect(dialog.getByRole('meter')).toHaveCount(3);
  await expect(dialog.getByRole('button', { name: /FERMER/ })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(card).toBeFocused();
});

test('chaque dossier s’ouvre avec son nom et son statut', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER' }).click();
  const names = [
    'Ellen Ripley',
    'Le Xénomorphe',
    'Ash',
    'Bishop',
    'Jonesy',
    'MU/TH/UR',
  ];
  for (const [i, name] of names.entries()) {
    const card = page.locator('.al-card').nth(i);
    await card.scrollIntoViewIfNeeded();
    await card.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name })).toBeVisible();
    await expect(dialog).toContainText('STATUT :');
    await page.keyboard.press('Escape');
  }
});

test('musique : le bouton son bascule, ou se désactive sans audio', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER' }).click();
  const sound = page.getByRole('button', { name: /^SOUND:/ });
  await expect(sound).toBeVisible();
  if (await sound.isDisabled()) {
    await expect(sound).toHaveText('SOUND: N/A');
    return;
  }
  await expect(sound).toHaveText('SOUND: ON');
  await expect(sound).toHaveAttribute('aria-pressed', 'true');
  await sound.click();
  await expect(sound).toHaveText('SOUND: OFF');
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
});

test('jeu de la page : pilotage au clavier', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER' }).click();
  await page
    .getByRole('button', { name: 'SURVIVRE', exact: true })
    .first()
    .click();
  const game = page.locator('.ds-game');
  await game.scrollIntoViewIfNeeded();
  await game.locator('canvas').focus();
  await page.keyboard.press('Enter');
  await expect(game).toHaveAttribute('data-state', 'playing');
  const x0 = Number(await game.getAttribute('data-ship-x'));
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(250);
  await page.keyboard.up('ArrowLeft');
  expect(Number(await game.getAttribute('data-ship-x'))).toBeLessThan(x0);
});

test('mobile 390 px : aucun défilement horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER' }).click();
  await expect(page.locator('.al-card').first()).toBeAttached();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('l’atelier d’origine reste accessible', async ({ page }) => {
  await page.goto('/#atelier');
  await expect(
    page.getByRole('heading', { name: 'Une source. Toutes les vues.' }),
  ).toBeVisible();
});
