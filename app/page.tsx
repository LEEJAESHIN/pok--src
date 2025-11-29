'use client'
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { getChoseong } from 'es-hangul';
import Image from "next/image";
import pokeList from '../lib/data/pokemon-name-map.json'
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link";
import { getTodaysPokemon } from "@/lib/pokemon-api";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [todaysPokemon, setTodaysPokemon] = useState<Array<{
    id: number;
    name: string;
    koreanName: string;
    sprite: string;
  }>>([])
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // useMemo로 검색 결과 계산 (searchQuery가 변경될 때만 재계산)
  const gachaPoke = useMemo(() => {
    if (searchQuery.length === 0) return []

    const resultsSet = new Set<string>() // 중복 제거
    const lowerQuery = searchQuery.toLowerCase()

    for (const koreanName in pokeList) {
      const englishName = pokeList[koreanName as keyof typeof pokeList]

      // 1. 영어 이름 검색 (대소문자 무시)
      if (englishName.includes(lowerQuery)) {
        resultsSet.add(koreanName)
        continue // 이미 찾았으면 다음 검색 스킵
      }

      // 2. 한글 이름 검색
      if (koreanName.includes(searchQuery)) {
        resultsSet.add(koreanName)
        continue
      }

      // 3. 초성 검색
      const choseong = getChoseong(koreanName)
      if (choseong.includes(searchQuery)) {
        resultsSet.add(koreanName)
      }
    }

    return Array.from(resultsSet)
  }, [searchQuery])

  // 오늘의 포켓몬 가져오기
  useEffect(() => {
    async function fetchTodaysPokemon() {
      const data = await getTodaysPokemon();
      setTodaysPokemon(data);
    }

    fetchTodaysPokemon();
  }, []);

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchQuery('');
      }
    }

    if (gachaPoke.length > 0) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [gachaPoke.length]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main
        className="flex min-h-screen w-full max-w-3xl flex-col items-center pt-16 px-8 bg-cover bg-no-repeat dark:bg-black sm:items-start"
      >
        <div className="flex w-full items-center justify-center mb-8">
          <Image src="/PokeSrc_logo.png" alt="PokéSrc Logo" width={270} height={90} priority />
        </div>
        <div className="relative w-full" ref={searchContainerRef}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={20} />
          <form action="/search" method="get" className="relative">
            <Input
              name="q"
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              className="bg-white rounded-full px-6 py-3 pl-12 pr-12 w-full"
              placeholder="포켓몬 이름 또는 초성을 검색하세요. (예: 피카츄, ㅍㅋㅊ)"
            />
            {/* <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-full px-3 py-1 text-xs font-medium transition-colors z-10"
            >
              검색
            </button> */}
          </form>
          {gachaPoke.length > 0 && (
            <Card className="absolute top-full mt-2 w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden animate-slide-down z-50 max-h-[400px]">
              <CardContent className="p-0 overflow-y-auto max-h-[400px]">
                {gachaPoke.map((pokemon) => (
                  <button
                    key={pokemon}
                    type="button"
                    onClick={() => {
                      const form = document.querySelector('form') as HTMLFormElement;
                      const input = form.querySelector('input[name="q"]') as HTMLInputElement;
                      input.value = pokemon;
                      form.submit();
                    }}
                    className="w-full px-6 py-2.5 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group border-b last:border-b-0 border-gray-100"
                  >
                    <div>
                      <div className="text-gray-900 font-medium">{pokemon}</div>
                      <div className="text-sm text-gray-500 capitalize">{pokeList[pokemon as keyof typeof pokeList]}</div>
                    </div>
                    <ArrowRight className="size-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 오늘의 포켓몬 섹션 */}
        <div className="w-full mt-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">오늘의 포켓몬은?</h2>
          {todaysPokemon.length === 0 ? (
            <div className="text-center text-gray-500">로딩 중...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {todaysPokemon.map((pokemon) => (
                <Link key={pokemon.id} href={`/search?q=${pokemon.koreanName}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardContent className="p-4 flex flex-col items-center">
                      <div className="relative w-24 h-24 mb-2">
                        <Image
                          src={pokemon.sprite}
                          alt={pokemon.koreanName}
                          fill
                          className="object-contain group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-800">{pokemon.koreanName}</p>
                        <p className="text-sm text-gray-500 capitalize">{pokemon.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
