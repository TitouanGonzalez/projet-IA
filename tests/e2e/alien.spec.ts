import { test, expect } from '@playwright/test';

// Attend la fin du défilement doux : l'élément visé doit être à l'écran et ne plus bouger.
// Le défilement est plus lent quand la machine est chargée, d'où cette attente active.
async function settle(page: import('@playwright/test').Page, selector: string) {
  const target = page.locator(selector).first();
  let last = Number.NaN;
  let stable = 0;
  for (let i = 0; i < 80 && stable < 4; i++) {
    const box = await target.boundingBox();
    const view = page.viewportSize()!;
    const visible = !!box && box.y >= 0 && box.y < view.height - 80;
    const y = box ? Math.round(box.y) : Number.NaN;
    stable = visible && y === last ? stable + 1 : 0;
    last = y;
    await page.waitForTimeout(120);
  }
}

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
  // Seule la collection de cartes est enregistrée, et rien d'autre.
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([
    'nostromo-collection-v1',
  ]);
});

test('fil de fer 3D animé et ouvert au survol du bouton', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER' }).click();
  const egg = page.locator('#accueil canvas.al-egg');
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
  // Le défilement est doux : on attend qu'il soit fini avant de viser la carte.
  await settle(page, '.al-card');
  await expect
    .poll(
      async () => {
        await card.scrollIntoViewIfNeeded();
        const box = (await card.boundingBox())!;
        await page.mouse.move(box.x + box.width - 40, box.y + 40);
        await page.mouse.move(box.x + box.width - 10, box.y + 10, { steps: 4 });
        return card.getAttribute('data-tilt');
      },
      { timeout: 15000, intervals: [200] },
    )
    .toBe('on');
  await expect
    .poll(() => card.evaluate((el) => el.style.getPropertyValue('--ry')))
    .not.toBe('0deg');
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
  await settle(page, '.al-trk-canvas');
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
  await settle(page, '.al-trk-canvas');
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
  await expect(page.locator('.al-trk-caption')).toContainText('contact', {
    ignoreCase: true,
  });
});

async function openTerminal(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER' }).click();
  await page.getByRole('button', { name: ':TERMINAL' }).click();
  const term = page.locator('.al-term');
  await expect(term).toHaveAttribute('data-phase', 'idle');
  await settle(page, '.al-term');
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
  await expect(term).toHaveAttribute('data-signal', '6');
  await answer(page, null);
  await expect(term).toHaveAttribute('data-phase', 'choice');
  await page.keyboard.press('1'); // matricule et rapport complet
  await expect(term).toHaveAttribute('data-signal', '5');
  await answer(page, /Décrire la créature telle qu/);
  await answer(page, /Proposer de livrer un spécimen/);
  await answer(page, /confirmation écrite/);
  await answer(page, null);
  await expect(term).toHaveAttribute('data-phase', 'write');
  // Une phrase toute faite suffit : pas besoin d'écrire.
  await page.getByRole('button', { name: /Selon le règlement/ }).click();
  await page.getByRole('button', { name: /PASSER L’ANIMATION/ }).click();
  await expect(term).toHaveAttribute('data-phase', 'win');
  await expect(term).toContainText('RÉFÉRENCE AU RÈGLEMENT NOTÉE');
  await expect(term).toContainText('RÉSULTAT : AIDE ACCEPTÉE');
  await page.getByRole('button', { name: 'REJOUER' }).click();
  await expect(term).toHaveAttribute('data-signal', '6');
  await expect(term).toHaveAttribute('data-phase', 'typing');
});

test('terminal : une partie perdue, la Compagnie refuse', async ({ page }) => {
  const term = await openTerminal(page);
  await answer(page, /appel de détresse brut/);
  await answer(page, /Insister, plus fort/);
  await answer(page, /aidez-nous/);
  await answer(page, /Demander une équipe de secours/);
  await answer(page, null);
  await expect(term).toHaveAttribute('data-phase', 'write');
  await page.getByRole('button', { name: /Écrire mon propre message/ }).click();
  await page.getByLabel('Ton message à la Compagnie').fill('aidez');
  await page.getByRole('button', { name: 'ENVOYER' }).click();
  await page.getByRole('button', { name: /PASSER L’ANIMATION/ }).click();
  await expect(term).toHaveAttribute('data-phase', 'lose');
  await expect(term).toContainText('MESSAGE TROP COURT');
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

test('terminal : écrire son propre argument, message vide refusé', async ({
  page,
}) => {
  const term = await openTerminal(page);
  await answer(page, /matricule/);
  await answer(page, /Décrire la créature telle qu/);
  await answer(page, /Écrire toi-même ton argument/);
  await answer(page, null);
  await expect(term).toHaveAttribute('data-phase', 'write');
  await expect(
    page.getByRole('list', { name: 'Phrases proposées' }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Écrire mon propre message/ }).click();
  const field = page.getByLabel('Ton message à la Compagnie');
  await expect(field).toBeFocused();
  const send = page.getByRole('button', { name: 'ENVOYER' });
  await expect(send).toBeDisabled();
  await field.fill('   ');
  await expect(send).toBeDisabled();
  // Les chiffres tapés dans le champ n'activent pas les choix.
  await field.fill('1');
  await expect(term).toHaveAttribute('data-phase', 'write');
  await field.fill(
    'Le règlement impose une assistance à un équipage en détresse.',
  );
  await page.keyboard.press('Control+Enter');
  await answer(page, null);
  await expect(term).toContainText('RÉFÉRENCE AU RÈGLEMENT NOTÉE');
  await expect(term).toHaveAttribute('data-signal', '2');
  await expect(term).toHaveAttribute('data-phase', 'choice');
});

test('détecteur : rester collé à un contact fait perdre, puis on relance', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER' }).click();
  await page.getByRole('button', { name: ':DÉTECTEUR' }).click();
  await settle(page, '.al-trk-canvas');
  const tracker = page.locator('.al-trk');
  const canvas = page.locator('.al-trk-canvas');
  const box = (await canvas.boundingBox())!;
  await expect(tracker).toHaveAttribute('data-lost', 'false');
  // On pose la sonde sur le contact le plus proche, en le suivant s'il bouge.
  const follow = async () => {
    const raw = (await tracker.getAttribute('data-contacts')) ?? '[]';
    const [cx, cy] = (JSON.parse(raw) as [number, number][])[0];
    await page.mouse.move(
      box.x + (cx * box.width) / 560,
      box.y + (cy * box.height) / 480,
    );
  };
  await expect
    .poll(
      async () => {
        await follow();
        return tracker.getAttribute('data-lost');
      },
      { timeout: 15000, intervals: [150] },
    )
    .toBe('true');
  await expect(page.getByRole('alert')).toContainText(
    'CONTACT. LIAISON PERDUE.',
  );
  await expect(page.locator('.al-trk-caption')).toContainText('Liaison perdue');
  await page.getByRole('button', { name: 'RELANCER' }).click();
  await expect(tracker).toHaveAttribute('data-lost', 'false');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('détecteur : un passage rapide près d’un contact ne fait pas perdre', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER' }).click();
  await page.getByRole('button', { name: ':DÉTECTEUR' }).click();
  await settle(page, '.al-trk-canvas');
  const tracker = page.locator('.al-trk');
  const box = (await page.locator('.al-trk-canvas').boundingBox())!;
  const raw = (await tracker.getAttribute('data-contacts')) ?? '[]';
  const [cx, cy] = (JSON.parse(raw) as [number, number][])[0];
  await page.mouse.move(
    box.x + (cx * box.width) / 560,
    box.y + (cy * box.height) / 480,
  );
  await page.waitForTimeout(400);
  await page.mouse.move(box.x + 5, box.y + 5);
  await expect
    .poll(async () => Number(await tracker.getAttribute('data-danger')), {
      timeout: 20000,
    })
    .toBeLessThan(0.5);
  await expect(tracker).toHaveAttribute('data-lost', 'false');
});

test('terminal : phrases proposées au clavier, retour depuis la saisie libre', async ({
  page,
}) => {
  const term = await openTerminal(page);
  await answer(page, /matricule/);
  await answer(page, /Décrire la créature telle qu/);
  await answer(page, /Proposer de livrer un spécimen/);
  await answer(page, /confirmation écrite/);
  await answer(page, null);
  await expect(term).toHaveAttribute('data-phase', 'write');
  const list = page.getByRole('list', { name: 'Phrases proposées' });
  await expect(list.getByRole('button')).toHaveCount(4);
  await page.keyboard.press('4'); // écrire son propre message
  await expect(page.getByLabel('Ton message à la Compagnie')).toBeFocused();
  await page.getByRole('button', { name: /REVENIR AUX PHRASES/ }).click();
  await expect(list).toBeVisible();
  await page.keyboard.press('1'); // première phrase proposée
  await page.getByRole('button', { name: /PASSER L’ANIMATION/ }).click();
  await expect(term).toHaveAttribute('data-phase', 'win');
});

const KEY = 'nostromo-collection-v1';

// Force le hasard à toujours donner la première carte légendaire (Ellen Ripley).
async function legendary(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    Math.random = () => 0.001;
  });
}
async function openCollection(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER' }).click();
  await page.getByRole('button', { name: /:COLLECTION/ }).click();
  await settle(page, '.al-pack-stage');
}
const eggButton = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: /Ouvrir un œuf|Aucun œuf/ });

test('œufs : trois au départ, une carte à l’ouverture, collection gardée après rechargement', async ({
  page,
}) => {
  await legendary(page);
  await openCollection(page);
  const pack = page.locator('.al-pack');
  await expect(pack).toHaveAttribute('data-eggs', '3');
  await expect(page.locator('.al-coll')).toHaveAttribute('data-owned', '0');
  await expect(page.getByText('PROCHAIN ŒUF DANS 09:5')).toBeVisible();
  await eggButton(page).click();
  await expect(pack).toHaveAttribute('data-phase', 'cracking');
  await expect(pack).toHaveAttribute('data-phase', 'revealed', {
    timeout: 8000,
  });
  await expect(pack).toHaveAttribute('data-eggs', '2');
  await expect(pack).toContainText('NOUVELLE CARTE');
  await expect(
    pack.getByRole('article', { name: /Ellen Ripley, carte légendaire/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('status').filter({ hasText: 'Carte obtenue' }),
  ).toContainText('Ellen Ripley, légendaire, nouvelle carte');
  await expect(page.locator('.al-coll')).toHaveAttribute('data-owned', '1');
  expect(
    JSON.parse(await page.evaluate((k) => localStorage.getItem(k)!, KEY)).owned,
  ).toEqual({ ripley: 1 });
  // La collection survit à un rechargement.
  await page.reload();
  await page.getByRole('button', { name: 'ENTER' }).click();
  await expect(page.locator('.al-pack')).toHaveAttribute('data-eggs', '2');
  await expect(page.locator('.al-coll')).toHaveAttribute('data-owned', '1');
});

test('œufs : les doublons sont comptés, et sans œuf on attend', async ({
  page,
}) => {
  await legendary(page);
  await openCollection(page);
  const pack = page.locator('.al-pack');
  for (let i = 0; i < 3; i++) {
    await eggButton(page)
      .or(page.getByRole('button', { name: /OUVRIR UN AUTRE ŒUF/ }))
      .first()
      .click();
    await expect(pack).toHaveAttribute('data-phase', 'revealed', {
      timeout: 8000,
    });
  }
  await expect(pack).toContainText('DOUBLON, 3 EXEMPLAIRES');
  await expect(pack).toHaveAttribute('data-eggs', '0');
  await expect(page.locator('.al-coll')).toHaveAttribute('data-copies', '3');
  await expect(page.locator('.al-coll')).toHaveAttribute('data-owned', '1');
  await page.getByRole('button', { name: 'FERMER' }).click();
  await expect(eggButton(page)).toBeDisabled();
  await expect(eggButton(page)).toHaveAccessibleName(
    'Aucun œuf disponible pour le moment',
  );
  await expect(page.getByText(/PROCHAIN ŒUF DANS/)).toBeVisible();
});

async function savedAs(
  page: import('@playwright/test').Page,
  eggs: number,
  agoMs: number,
) {
  await page.addInitScript(
    ({ key, eggs, agoMs }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          eggs,
          last: Date.now() - agoMs,
          owned: {},
          demo: false,
        }),
      );
    },
    { key: KEY, eggs, agoMs },
  );
}

test('œufs : ceux gagnés pendant l’absence sont ajoutés', async ({ page }) => {
  await savedAs(page, 0, 35 * 60_000); // 35 minutes : trois œufs
  await openCollection(page);
  await expect(page.locator('.al-pack')).toHaveAttribute('data-eggs', '3');
});

test('œufs : une très longue absence ne dépasse pas dix œufs', async ({
  page,
}) => {
  await savedAs(page, 4, 24 * 3600_000);
  await openCollection(page);
  await expect(page.locator('.al-pack')).toHaveAttribute('data-eggs', '10');
  await expect(
    page.getByText('STOCK PLEIN. LE COMPTEUR EST EN PAUSE.'),
  ).toBeVisible();
});

test('œufs : une sauvegarde abîmée ne casse pas la page', async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, '{{ pas du json');
  }, KEY);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await openCollection(page);
  await expect(page.locator('.al-pack')).toHaveAttribute('data-eggs', '3');
  await expect(page.locator('.al-coll')).toHaveAttribute('data-owned', '0');
  expect(errors).toEqual([]);
});

test('collection : 24 cartes, filtre par rareté, mode démo et réinitialisation', async ({
  page,
}) => {
  await legendary(page);
  await openCollection(page);
  const cells = page.locator('.al-coll-cell');
  await expect(cells).toHaveCount(24);
  await page.getByRole('button', { name: 'LÉGENDAIRE', exact: true }).click();
  await expect(cells).toHaveCount(2);
  await page.getByRole('button', { name: 'COMMUNE', exact: true }).click();
  await expect(cells).toHaveCount(6);
  await page.getByRole('button', { name: 'TOUTES', exact: true }).click();
  await expect(cells).toHaveCount(24);
  // Des cartes pas encore obtenues sont des cases verrouillées.
  await expect(
    page.getByRole('article', { name: /pas encore obtenue/ }),
  ).toHaveCount(24);
  await eggButton(page).click();
  await expect(page.locator('.al-pack')).toHaveAttribute(
    'data-phase',
    'revealed',
    {
      timeout: 8000,
    },
  );
  await expect(
    page.getByRole('article', { name: /pas encore obtenue/ }),
  ).toHaveCount(23);
  // Mode démo : un œuf toutes les 10 secondes, donc le stock remonte vite.
  await page.getByRole('button', { name: /MODE DÉMO/ }).click();
  await expect(
    page.getByRole('button', { name: /MODE DÉMO ACTIVÉ/ }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(/\(MODE DÉMO\)/)).toBeVisible();
  await expect
    .poll(
      async () =>
        Number(await page.locator('.al-pack').getAttribute('data-eggs')),
      {
        timeout: 25_000,
        intervals: [500],
      },
    )
    .toBeGreaterThanOrEqual(3);
  // Réinitialiser demande une confirmation.
  const reset = page.getByRole('button', {
    name: 'RÉINITIALISER LA COLLECTION',
  });
  await reset.click();
  await expect(page.locator('.al-coll')).toHaveAttribute('data-owned', '1');
  await page.getByRole('button', { name: /CONFIRMER : TOUT EFFACER/ }).click();
  await expect(page.locator('.al-coll')).toHaveAttribute('data-owned', '0');
  await expect(page.locator('.al-pack')).toHaveAttribute('data-eggs', '3');
});

test('œufs : au clavier, et la pastille du menu compte les œufs', async ({
  page,
}) => {
  await legendary(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER' }).click();
  await expect(page.getByRole('button', { name: /:COLLECTION/ })).toContainText(
    '3',
  );
  await page.getByRole('button', { name: /:COLLECTION/ }).click();
  await settle(page, '.al-pack-stage');
  await eggButton(page).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.al-pack')).toHaveAttribute(
    'data-phase',
    'revealed',
    {
      timeout: 8000,
    },
  );
  await expect(page.getByRole('button', { name: /:COLLECTION/ })).toContainText(
    '2',
  );
});
