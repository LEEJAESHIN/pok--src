import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main
        className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-[url('../public/bg-img.jpg')] bg-cover bg-no-repeat dark:bg-black sm:items-start"
        style={{ backgroundPosition: '51% 70%' }}
      >
        테스트코드
      </main>
    </div>
  );
}
