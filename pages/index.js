import Head from "next/head";
import axios from "axios";
import Link from "next/link";

import Hero from "../components/hero/Hero";
import Introduction from "../components/introduction/Introduction";
import Footer from "../components/footer/Footer";
import style from "../styles/index.scss";

export default function Home({ randomPosterUrl }) {
  return (
    <>
      <Head>
        <title>Movie News Letter</title>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css"
        />
      </Head>
      <main className={style.landing}>
        <Hero randomPosterUrl={randomPosterUrl} />
        <Introduction />
      </main>
      <Footer />
    </>
  );
}

export async function getServerSideProps() {
  const res = await axios.get(`http://localhost:3000/api/top-movies`);
  function selectRandomFromArray(arr) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
  }
  //res.data has many movies
  const randomTopMovie = selectRandomFromArray(res.data);
  //a movie has many posters
  const randomPosterUrl =
    selectRandomFromArray(randomTopMovie.image_path) ||
    "https://image.tmdb.org/t/p/original/eMAHXzZXoNzximFSYm2hn0LiPB0.jpg";

  return {
    props: { randomPosterUrl },
  };
}