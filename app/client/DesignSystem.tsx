import { useState, type CSSProperties, type ReactNode } from 'react';
import { tokenCss, type Tokens } from '../shared/model.js';

// Design system Alien. Les composants viennent du site Nostromo (dépôt pfe) : mêmes noms, mêmes
// états. Toutes les couleurs, tailles et espacements passent par les tokens, donc un changement
// de token dans l'atelier se voit partout. Chaque état porte une icône ET un texte : la couleur
// ne porte jamais seule l'information.

export function DSProvider({
  tokens,
  children,
}: {
  tokens: Tokens;
  children: ReactNode;
}) {
  return (
    <div className="ds" style={tokenCss(tokens) as CSSProperties}>
      {children}
    </div>
  );
}

export function Button({
  variant = 'primary',
  children,
  disabled = false,
  onClick,
}: {
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`ds-button ${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Icon({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
const icons = {
  survivant: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  hostile: (
    <>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5M12 18v.5" />
    </>
  ),
  desactive: <path d="M6 6l12 12M18 6L6 18" />,
};

// --- Dossier : la carte d'un personnage, avec son statut et ses jauges.
export type CrewState = 'survivant' | 'hostile' | 'desactive';
const crewLabels: Record<CrewState, string> = {
  survivant: 'Survivante',
  hostile: 'Non neutralisé',
  desactive: 'Désactivé',
};
export function CrewStatus({ state }: { state: CrewState }) {
  return (
    <span className={`ds-crew ${state}`}>
      <Icon size={16}>{icons[state]}</Icon>
      {crewLabels[state]}
    </span>
  );
}

export function Gauge({ label, value }: { label: string; value: number }) {
  return (
    <div className="ds-gauge">
      <span>{label}</span>
      <div
        className="ds-gauge-bar"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <i style={{ width: `${value}%` }} />
      </div>
      <b>{value}</b>
    </div>
  );
}

export function DossierCard() {
  const [open, setOpen] = useState(false);
  return (
    <article className="ds-card">
      <div className="card-kicker">DOSSIER 01 / ALIEN, 1979</div>
      <h3>Ellen Ripley</h3>
      <p>Officier du Nostromo. Seule à sortir vivante du premier vol.</p>
      <div className="card-meta">
        <CrewStatus state="survivant" />
        <span>Pont A</span>
      </div>
      <div className="ds-gauges">
        <Gauge label="Sang-froid" value={92} />
        <Gauge label="Ruse" value={85} />
        <Gauge label="Confiance" value={22} />
      </div>
      <Button onClick={() => setOpen(!open)}>
        {open ? 'Dossier ouvert' : 'Ouvrir le dossier'}
      </Button>
      <span role="status" className="ds-feedback">
        {open ? 'Dossier de démonstration, aucune donnée envoyée.' : ''}
      </span>
    </article>
  );
}

// --- Raretés : cinq niveaux, chacun avec un nom écrit et un nombre de carrés allumés.
export type Rarity =
  'commune' | 'peu_commune' | 'rare' | 'super_rare' | 'legendaire';
const rarityInfo: Record<Rarity, { label: string; level: number }> = {
  commune: { label: 'Commune', level: 1 },
  peu_commune: { label: 'Peu commune', level: 2 },
  rare: { label: 'Rare', level: 3 },
  super_rare: { label: 'Super rare', level: 4 },
  legendaire: { label: 'Légendaire', level: 5 },
};
export function Pips({ level }: { level: number }) {
  return (
    <span className="ds-pips" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={n <= level ? 'on' : ''} />
      ))}
    </span>
  );
}
export function RarityTag({ rarity }: { rarity: Rarity }) {
  const r = rarityInfo[rarity];
  return (
    <span className={`ds-rarity ${rarity}`}>
      <Pips level={r.level} />
      {r.label}
    </span>
  );
}
export function RarityCard({
  rarity,
  name,
  text,
}: {
  rarity: Rarity;
  name: string;
  text: string;
}) {
  return (
    <article className={`ds-rcard ${rarity}`}>
      <div className="ds-rcard-top">
        <RarityTag rarity={rarity} />
      </div>
      <div className="ds-art" role="img" aria-label="Illustration de la carte">
        <Icon size={44}>
          <circle cx="12" cy="9" r="4" />
          <path d="M4 21c1-5 4-7 8-7s7 2 8 7" />
        </Icon>
      </div>
      <h3>{name}</h3>
      <p>{text}</p>
    </article>
  );
}

// --- Journal de bord : une ligne de MU/TH/UR.
export function LogLine({ children }: { children: ReactNode }) {
  return (
    <p className="ds-log" role="status">
      {'> '}
      {children}
    </p>
  );
}

export function ExampleForm() {
  const [sent, setSent] = useState(false);
  return (
    <form
      className="ds-form"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <label>
        Ton matricule
        <input
          placeholder="RIPLEY-E"
          required
          onChange={() => setSent(false)}
        />
      </label>
      <label>
        Ton message à la Compagnie
        <input
          placeholder="Nous demandons de l’aide."
          required
          onChange={() => setSent(false)}
        />
      </label>
      <label>
        Liaison longue distance
        <input placeholder="Indisponible" disabled />
      </label>
      <label className="ds-check">
        <input type="checkbox" required /> Je comprends que c’est une
        démonstration
      </label>
      <button className="ds-button primary" type="submit">
        Envoyer le message
      </button>
      <p role="status">
        {sent
          ? 'Message de démonstration envoyé. Aucune donnée n’est envoyée.'
          : ''}
      </p>
    </form>
  );
}

export function Navigation() {
  const [tab, setTab] = useState('Dossiers');
  return (
    <nav aria-label="Navigation du scénario" className="ds-nav">
      {['Dossiers', 'Détecteur', 'Terminal'].map((t) => (
        <button
          key={t}
          aria-current={tab === t ? 'page' : undefined}
          onClick={() => setTab(t)}
        >
          {t}
        </button>
      ))}
      <p className="nav-context" aria-live="polite">
        {tab === 'Détecteur'
          ? 'Les contacts apparaissent quand tu approches.'
          : tab === 'Terminal'
            ? 'Appelle la Compagnie : tu as six messages.'
            : 'Six dossiers, un seul vol.'}
      </p>
    </nav>
  );
}

export function Catalogue({ tokens }: { tokens: Tokens }) {
  return (
    <DSProvider tokens={tokens}>
      <div className="catalogue">
        <section>
          <div className="section-label">01 / ACTIONS</div>
          <h3>Un langage commun.</h3>
          <p>Les mêmes tokens, du composant à l’écran.</p>
          <div className="button-row">
            <Button>Action principale</Button>
            <Button variant="secondary">Secondaire</Button>
            <Button variant="danger">Éjecter</Button>
            <Button disabled>Indisponible</Button>
          </div>
          <p className="ds-caption">
            Survole, utilise Tab et active les boutons. Focus et états natifs
            inclus.
          </p>
        </section>
        <section>
          <div className="section-label">02 / CONTENUS</div>
          <DossierCard />
        </section>
        <section>
          <div className="section-label">03 / SAISIE</div>
          <ExampleForm />
        </section>
        <section>
          <div className="section-label">04 / NAVIGATION</div>
          <Navigation />
        </section>
        <section>
          <div className="section-label">05 / RARETÉS</div>
          <h3>Cinq niveaux, jamais la couleur seule.</h3>
          <p>
            Chaque rareté a son nom écrit et un nombre de carrés allumés, de un
            à cinq.
          </p>
          <div className="ds-stack">
            <RarityTag rarity="commune" />
            <RarityTag rarity="peu_commune" />
            <RarityTag rarity="rare" />
            <RarityTag rarity="super_rare" />
            <RarityTag rarity="legendaire" />
          </div>
          <div className="ds-cards">
            <RarityCard
              rarity="commune"
              name="Détecteur"
              text="Un petit appareil qui bipe quand quelque chose approche."
            />
            <RarityCard
              rarity="rare"
              name="Dallas"
              text="Capitaine du Nostromo, calme et méthodique."
            />
            <RarityCard
              rarity="legendaire"
              name="Ellen Ripley"
              text="Seule humaine à sortir vivante du premier vol."
            />
          </div>
        </section>
        <section>
          <div className="section-label">06 / STATUTS ET JOURNAL</div>
          <h3>Statut de l’équipage et voix du vaisseau.</h3>
          <div className="ds-stack">
            <CrewStatus state="survivant" />
            <CrewStatus state="hostile" />
            <CrewStatus state="desactive" />
          </div>
          <LogLine>LIAISON ÉTABLIE. BIENVENUE À BORD DU NOSTROMO.</LogLine>
          <p className="ds-caption">
            Le journal est lu à la demande par les lecteurs d’écran et se coupe
            avec un bouton.
          </p>
        </section>
      </div>
    </DSProvider>
  );
}

export function Scenario({
  tokens,
  scenario,
}: {
  tokens: Tokens;
  scenario: string;
}) {
  return (
    <DSProvider tokens={tokens}>
      <div className="scenario">
        <header className="scenario-head">
          <strong>Nostromo</strong>
          <span className="ds-badge">Session 4821</span>
        </header>
        <Navigation />
        <main>
          <div className="section-label">// DOSSIERS DE L’ÉQUIPAGE</div>
          <h1>
            Six dossiers,
            <br />
            un seul vol.
          </h1>
          <p>Ouvre un dossier pour lire la fiche. La carte suit ta souris.</p>
          {scenario === 'form' ? (
            <div className="ds-card">
              <h2>Appelle la Compagnie.</h2>
              <ExampleForm />
            </div>
          ) : (
            <div className="scenario-grid">
              <DossierCard />
              <article className="ds-card">
                <div className="card-kicker">DOSSIER 02 / ALIEN, 1979</div>
                <h3>Le Xénomorphe</h3>
                <p>
                  Forme de vie hostile. Plus on s’approche, moins on repart.
                </p>
                <div className="card-meta">
                  <CrewStatus state="hostile" />
                </div>
                <Button variant="secondary">Voir la fiche</Button>
              </article>
            </div>
          )}
        </main>
        <footer>Nostromo · design system Alien</footer>
      </div>
    </DSProvider>
  );
}
