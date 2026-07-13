import ContentLayout from '../components/ContentLayout';
import { createWebSiteSchema } from '../components/StructuredData';
import { useMemo } from 'react';

export default function EnglishLanding() {
  const schema = useMemo(() => createWebSiteSchema(), []);

  return (
    <ContentLayout
      title="KelimeLink — The Turkish Linxicon Alternative"
      seo={{
        title: 'KelimeLink — The Turkish Linxicon Alternative',
        description: 'KelimeLink is the Turkish equivalent of Linxicon. A semantic word connection puzzle for Turkish speakers. Free daily puzzle, practice mode, and multiplayer.',
        path: '/en',
        ogTitle: 'KelimeLink — Turkish Semantic Word Game',
        ogDescription: 'Looking for a Turkish Linxicon or Contexto alternative? KelimeLink is a semantic word connection puzzle for Turkish speakers.',
      }}
      structuredData={schema}
      breadcrumbs={[
        { name: 'Ana Sayfa', path: '/' },
        { name: 'English', path: '/en' },
      ]}
    >
      <h1>KelimeLink — The Turkish Linxicon Alternative</h1>

      <p>
        Are you looking for a Turkish version of <strong>Linxicon</strong>, <strong>Contexto</strong>,
        or <strong>Semantle</strong>? While those popular semantic word games don't have official
        Turkish releases, we built <strong>KelimeLink</strong> specifically for Turkish speakers.
      </p>

      <h2>What is KelimeLink?</h2>
      <p>
        KelimeLink is an AI-powered semantic word connection puzzle. Just like Linxicon,
        your goal is to build a semantic bridge between two completely unrelated words.
        You type a word, and our AI calculates how close its meaning is to the words already
        on the board. If the cosine similarity is above our threshold (26%), a connection is made.
      </p>

      <h2>Key Features</h2>
      <ul>
        <li>
          <strong>Daily Puzzle:</strong> Every day, a new puzzle is released
          for everyone to solve.
        </li>
        <li>
          <strong>Practice Mode:</strong> Play unlimited random puzzles to improve your
          vocabulary and lateral thinking. Our advanced Hint system will guide you if you get stuck.
        </li>
        <li>
          <strong>VS Mode (Multiplayer):</strong> Race against your friends in real-time
          by creating a private room.
        </li>
        <li>
          <strong>Native Turkish NLP:</strong> Powered by the ConceptNet Numberbatch model,
          optimized for the rich morphological structure of the Turkish language.
        </li>
      </ul>

      <h2>Why Isn't There an Official Turkish Linxicon?</h2>
      <p>
        Semantic word games rely on massive language models (like Word2Vec or MiniLM) to understand
        word relationships. Translating an English game into Turkish isn't just about changing the UI;
        it requires completely swapping the underlying artificial intelligence model. Turkish, being an
        agglutinative language, poses unique challenges for NLP models. KelimeLink was built from
        the ground up to address these challenges and provide an authentic semantic puzzle experience
        for Turkish speakers.
      </p>

      <p>
        Ready to test your Turkish vocabulary? <a href="/">Click here to play the Daily Puzzle!</a>
      </p>

    </ContentLayout>
  );
}
