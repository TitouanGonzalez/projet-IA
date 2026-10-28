import { test, expect } from '@playwright/test';

const title = 'Nostromo, dossiers de l’équipage';

test('intro : démarrage du terminal, puis entrée sur le site', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: title })).toBeAttached();
  await expect(page.locator('[data-phase="intro"]')).toBeVisible();
  await expect(page.getByText('START BOOTING SYSTEM...')).toBeVisible({
    timeout: 10_000,
  });
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

test('sons d’interaction : aucune erreur, son allumé puis coupé', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER' }).click();
  const card = page.locator('.al-card').first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await card.click();
  await page.keyboard.press('Escape');
  const sound = page.getByRole('button', { name: /^SOUND:/ });
  if (await sound.isEnabled()) await sound.click();
  await card.hover();
  await card.click();
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('le jeu de vaisseau n’est plus sur la page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER' }).click();
  await expect(page.locator('.ds-game')).toHaveCount(0);
  await expect(page.getByText('SURVIVRE')).toHaveCount(0);
});

test('détecteur : la sonde suit la souris et la distance s’affiche', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER' }).click();
  await page.getByRole('button', { name: ':DÉTECTEUR' }).click();
  const tracker = page.locator('.al-trk');
  await expect(tracker).toBeVisible();
  await expect(tracker).toHaveAttribute('data-probe-x', 'none');
  await page.waitForTimeout(1500);
  const canvas = page.locator('.al-trk-canvas');
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await expect(tracker).not.toHaveAttribute('data-probe-x', 'none');
  const nearest = Number(await tracker.getAttribute('data-nearest'));
  expect(nearest).toBeGreaterThanOrEqual(0);
  await expect(page.locator('.al-trk-readout')).toHaveText(/^\d\d\.\d\d$/);
  expect(['far', 'suspect', 'close']).toContain(
    await tracker.getAttribute('data-state'),
  );
  await page.mouse.move(5, 5);
  await expect(tracker).toHaveAttribute('data-probe-x', 'none');
  await expect(page.locator('.al-trk-readout')).toHaveText('--.--');
});

test('détecteur : clavier et impulsion avec recharge', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER' }).click();
  await page.getByRole('button', { name: ':DÉTECTEUR' }).click();
  const tracker = page.locator('.al-trk');
  await page.locator('.al-trk-canvas').focus();
  await page.keyboard.press('ArrowRight');
  await expect(tracker).not.toHaveAttribute('data-probe-x', 'none');
  const x0 = Number(await tracker.getAttribute('data-probe-x'));
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(async () => Number(await tracker.getAttribute('data-probe-x')))
    .toBeGreaterThan(x0);
  await expect
    .poll(async () => Number(await tracker.getAttribute('data-charge')))
    .toBeGreaterThanOrEqual(0.99);
  await page.keyboard.press(' ');
  await expect
    .poll(async () => Number(await tracker.getAttribute('data-charge')))
    .toBeLessThan(0.5);
  await expect(page.getByRole('status').last()).toContainText('contact', {
    ignoreCase: true,
  });
});

async function openTerminal(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER' }).click();
  await page.getByRole('button', { name: ':TERMINAL' }).click();
  const term = page.locator('.al-term');
  await expect(term).toHaveAttribute('data-phase', 'idle');
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'OUVRIR LA LIAISON' }).click();
  return term;
}
async function answer(
  page: import('@playwright/test').Page,
  choice: RegExp | null,
) {
  await page.getByRole('button', { name: /PASSER L’ANIMATION/ }).click();
  const term = page.locator('.al-term');
  await expect(term).not.toHaveAttribute('data-phase', 'typing');
  if (choice)
    await page
      .locator('.al-term-choices')
      .getByRole('button', { name: choice })
      .click();
}

test('terminal : une partie gagnée, au clavier puis à la souris', async ({
  page,
}) => {
  const term = await openTerminal(page);
  await expect(term).toHaveAttribute('data-phase', 'typing');
  await expect(term).toHaveAttribute('data-signal', '5');
  await answer(page, null);
  await expect(term).toHaveAttribute('data-phase', 'choice');
  await page.keyboard.press('1'); // matricule et rapport complet
  await expect(term).toHaveAttribute('data-signal', '4');
  await answer(page, /Décrire la créature telle qu/);
  await answer(page, /Proposer de livrer un spécimen/);
  await answer(page, /confirmation écrite/);
  await page.getByRole('button', { name: /PASSER L’ANIMATION/ }).click();
  await expect(term).toHaveAttribute('data-phase', 'win');
  await expect(term).toContainText('RÉSULTAT : AIDE ACCEPTÉE');
  await page.getByRole('button', { name: 'REJOUER' }).click();
  await expect(term).toHaveAttribute('data-signal', '5');
  await expect(term).toHaveAttribute('data-phase', 'typing');
});

test('terminal : une partie perdue, la Compagnie refuse', async ({ page }) => {
  const term = await openTerminal(page);
  await answer(page, /appel de détresse brut/);
  await answer(page, /Insister, plus fort/);
  await answer(page, /aidez-nous/);
  await answer(page, /Demander une équipe de secours/);
  await page.getByRole('button', { name: /PASSER L’ANIMATION/ }).click();
  await expect(term).toHaveAttribute('data-phase', 'lose');
  await expect(term).toContainText('RÉSULTAT : DEMANDE REFUSÉE');
  await expect(page.getByRole('button', { name: 'REJOUER' })).toBeVisible();
});

test('terminal : le journal est annoncé et les jauges sont lisibles', async ({
  page,
}) => {
  await openTerminal(page);
  await expect(page.getByRole('log')).toBeVisible();
  await expect(page.getByRole('meter')).toHaveCount(3);
  await answer(page, null);
  await expect(page.getByRole('log')).toContainText(
    'Comment ouvres-tu ton message',
  );
});
