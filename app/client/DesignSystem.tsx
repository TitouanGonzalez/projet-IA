import { useState, type CSSProperties, type ReactNode } from 'react';
import { tokenCss, type Tokens } from '../shared/model.js';
import { Game } from './Game.js';

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
export function BookingCard() {
  const [booked, setBooked] = useState(false);
  return (
    <article className="ds-card">
      <div className="card-kicker">Verdict pour ton profil</div>
      <h3>Clair Obscur: Expedition 33</h3>
      <p>
        Jeu de rôle au tour par tour. Le mode Histoire élargit les fenêtres
        d’esquive et de parade.
      </p>
      <div className="card-meta">
        <span className="ds-badge">4 sur 5 besoins couverts</span>
        <span>Xbox Series</span>
      </div>
      <Button onClick={() => setBooked(!booked)}>
        {booked ? 'Jeu suivi' : 'Suivre ce jeu'}
      </Button>
      <span role="status" className="ds-feedback">
        {booked ? 'Suivi de démonstration, aucune donnée envoyée.' : ''}
      </span>
    </article>
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
        Ton prénom
        <input placeholder="Léa" required onChange={() => setSent(false)} />
      </label>
      <label>
        Ton adresse e-mail
        <input
          type="email"
          placeholder="lea@example.com"
          required
          onChange={() => setSent(false)}
        />
      </label>
      <label>
        Champ désactivé
        <input placeholder="Non disponible" disabled />
      </label>
      <label className="ds-check">
        <input type="checkbox" required /> Je comprends que c’est une
        démonstration
      </label>
      <button className="ds-button primary" type="submit">
        Créer mon profil
      </button>
      <p role="status">
        {sent
          ? 'Profil de démonstration créé. Aucune donnée n’est envoyée.'
          : ''}
      </p>
    </form>
  );
}
export function Navigation() {
  const [tab, setTab] = useState('Un jeu');
  return (
    <nav aria-label="Navigation du scénario" className="ds-nav">
      {['Un jeu', 'Trouver', 'Mon profil'].map((t) => (
        <button
          key={t}
          aria-current={tab === t ? 'page' : undefined}
          onClick={() => setTab(t)}
        >
          {t}
        </button>
      ))}
      <p className="nav-context" aria-live="polite">
        {tab === 'Trouver'
          ? 'Les jeux jouables pour toi apparaîtront ici.'
          : tab === 'Mon profil'
            ? 'Ton profil de besoins, jamais ton diagnostic.'
            : 'Vérifie un jeu avant de l’acheter.'}
      </p>
    </nav>
  );
}
// Composants Checkpoint, repris du fichier Figma (Verdict, Statut info, Carte jeu).
// Chaque état porte une icône ET un texte : la couleur ne porte jamais seule l'information.
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
  valide: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  adaptations: (
    <>
      <path d="M5 9h14M15 5l4 4-4 4" />
      <path d="M19 16H5M9 12l-4 4 4 4" />
    </>
  ),
  bloquant: <path d="M6 6l12 12M18 6L6 18" />,
  verifie: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l3 3 5-6" />
    </>
  ),
  declare: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M9 13h6M9 17h6" />
    </>
  ),
  conteste: (
    <>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5M12 18v.5" />
    </>
  ),
  inconnu: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.6 2.6 0 015 1c0 1.8-2.5 2-2.5 3.7M12 17.5v.5" />
    </>
  ),
};
export type VerdictState = 'jouable' | 'adaptations' | 'bloquant';
const verdictLabels: Record<VerdictState, string> = {
  jouable: 'Jouable pour toi',
  adaptations: 'Jouable avec adaptations',
  bloquant: 'Pas jouable en l’état',
};
export function Verdict({ state }: { state: VerdictState }) {
  return (
    <span className={`ds-verdict ${state}`}>
      <Icon size={20}>{icons[state === 'jouable' ? 'valide' : state]}</Icon>
      {verdictLabels[state]}
    </span>
  );
}
export type StatutState = 'verifie' | 'declare' | 'conteste' | 'inconnu';
const statutLabels: Record<StatutState, string> = {
  verifie: 'Vérifié par 14 joueurs',
  declare: 'Déclaré par le studio',
  conteste: 'Contesté par 3 joueurs',
  inconnu: 'On ne sait pas encore',
};
export function StatutInfo({ state }: { state: StatutState }) {
  return (
    <span className={`ds-statut ${state}`}>
      <Icon size={16}>{icons[state]}</Icon>
      {statutLabels[state]}
    </span>
  );
}
export function GameCard() {
  return (
    <article className="ds-gamecard">
      <div className="ds-cover" role="img" aria-label="Jaquette illustrée" />
      <h3>Clair Obscur: Expedition 33</h3>
      <p className="ds-platforms">PS5, Xbox Series, PC</p>
      <Verdict state="adaptations" />
      <ul className="ds-needs">
        <li>
          <span className="need-ok">
            <Icon size={20}>{icons.valide}</Icon>
          </span>
          Texte et sous-titres réglables
        </li>
        <li>
          <span className="need-adapt">
            <Icon size={20}>{icons.adaptations}</Icon>
          </span>
          Pas de remapping déclaré, ta manette compense
        </li>
        <li>
          <span className="need-ok">
            <Icon size={20}>{icons.valide}</Icon>
          </span>
          Mode Histoire, esquives plus faciles
        </li>
      </ul>
      <StatutInfo state="verifie" />
    </article>
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
            <Button variant="danger">Supprimer</Button>
            <Button disabled>Indisponible</Button>
          </div>
          <p className="ds-caption">
            Survolez, utilisez Tab et activez les boutons. Focus et états natifs
            inclus.
          </p>
        </section>
        <section>
          <div className="section-label">02 / CONTENUS</div>
          <BookingCard />
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
          <div className="section-label">05 / CHECKPOINT</div>
          <h3>Verdict, statut et carte jeu.</h3>
          <p>Chaque état a une icône et un texte, jamais la couleur seule.</p>
          <div className="ds-stack">
            <Verdict state="jouable" />
            <Verdict state="adaptations" />
            <Verdict state="bloquant" />
          </div>
          <div className="ds-stack">
            <StatutInfo state="verifie" />
            <StatutInfo state="declare" />
            <StatutInfo state="conteste" />
            <StatutInfo state="inconnu" />
          </div>
          <GameCard />
        </section>
        <section>
          <div className="section-label">06 / JEU</div>
          <h3>Esquive les obstacles.</h3>
          <p>
            Le vaisseau et les obstacles prennent les couleurs de tes tokens.
          </p>
          <Game />
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
          <strong>Checkpoint</strong>
          <span className="ds-badge">Xbox Series</span>
        </header>
        <Navigation />
        <main>
          <div className="section-label">Avant d’acheter</div>
          <h1>
            Sache si tu
            <br />
            pourras y jouer.
          </h1>
          <p>Un verdict clair pour chaque jeu, à partir de tes besoins.</p>
          {scenario === 'form' ? (
            <div className="ds-card">
              <h2>Crée ton profil de besoins.</h2>
              <ExampleForm />
            </div>
          ) : (
            <div className="scenario-grid">
              <BookingCard />
              <article className="ds-card">
                <div className="card-kicker">Autre jeu</div>
                <h3>Baldur’s Gate 3</h3>
                <p>Tour par tour, jouable sans appuis rapides.</p>
                <Button variant="secondary">Voir la fiche</Button>
              </article>
            </div>
          )}
        </main>
        <footer>Checkpoint · design system du PFE</footer>
      </div>
    </DSProvider>
  );
}
