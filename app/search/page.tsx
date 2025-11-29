import Image from "next/image";
import Link from "next/link";
import { searchPokemon, getPokemonSpecies, getKoreanName, getCompetitiveStats } from "@/lib/pokemon-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTypeColor, getKoreanTypeName } from "@/lib/pokemon-types/type-colors";
import { getDefensiveEffectiveness, getOffensiveEffectiveness } from "@/lib/pokemon-types/type-effectiveness";
import { getKoreanStatName, analyzePokemonRole, calculateTotalStats } from "@/lib/utils";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  let pokemon = null;
  let koreanName = "";
  let competitiveStats = null;

  if (query) {
    pokemon = await searchPokemon(query);
    if (pokemon) {
      const species = await getPokemonSpecies(pokemon.id);
      if (species) {
        koreanName = getKoreanName(species);
      }
      // Pokemoem 배틀 통계 가져오기 (한국 배틀 데이터)
      competitiveStats = await getCompetitiveStats(pokemon.id);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <div className="w-full max-w-3xl px-8 py-8">
        <div className="flex items-center justify-center mb-8">
          <Link href="/">
            <Image
              src="/PokeSrc_logo.png"
              alt="PokéSrc Logo"
              width={200}
              height={66}
              priority
            />
          </Link>
        </div>

        {!query ? (
          <div className="bg-white rounded-lg p-8 shadow-sm text-center">
            <p className="text-gray-400">검색어를 입력해주세요.</p>
          </div>
        ) : !pokemon ? (
          <div className="bg-white rounded-lg p-8 shadow-sm text-center">
            <p className="text-gray-600">
              &quot;{query}&quot;에 대한 검색 결과를 찾을 수 없습니다.
            </p>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl">
                  {koreanName || pokemon.name}
                  <span className="text-lg text-gray-500 ml-2">
                    #{pokemon.id.toString().padStart(3, "0")}
                  </span>
                </CardTitle>
                <div className="flex gap-2">
                  {pokemon.types.map((type) => (
                    <Badge
                      key={type.type.name}
                      style={{
                        backgroundColor: getTypeColor(type.type.name),
                        color: '#fff',
                        border: 'none'
                      }}
                    >
                      {getKoreanTypeName(type.type.name)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0">
                  <Image
                    src={pokemon.sprites.other["official-artwork"].front_default}
                    alt={koreanName || pokemon.name}
                    width={300}
                    height={300}
                    className="w-full max-w-[300px] h-auto"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-4">기본 정보</h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">높이:</span> {pokemon.height / 10}m
                    </p>
                    <p>
                      <span className="font-medium">무게:</span> {pokemon.weight / 10}kg
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-6 mb-4">
                    <h3 className="text-xl font-semibold">능력치</h3>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      총합 {calculateTotalStats(pokemon.stats)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {pokemon.stats.map((stat) => (
                      <div key={stat.stat.name} className="flex items-center gap-2">
                        <span className="w-32 text-sm">{getKoreanStatName(stat.stat.name)}:</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(stat.base_stat / 255) * 100}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-sm">{stat.base_stat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {pokemon && competitiveStats && (
          <div className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">대전 추천 정보 (한국 랭크배틀)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-lg">역할</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-medium">{analyzePokemonRole(pokemon.stats)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-lg">추천 특성</h4>
                    <div className="space-y-2">
                      {competitiveStats.abilities.map((ability, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="capitalize">{ability.name}</span>
                          <span className="text-sm text-gray-500">{ability.usage.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-lg">추천 성격</h4>
                    <div className="space-y-2">
                      {competitiveStats.natures.map((nature, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="capitalize">{nature.name}</span>
                          <span className="text-sm text-gray-500">{nature.usage.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-lg">추천 도구</h4>
                    <div className="space-y-2">
                      {competitiveStats.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="capitalize">{item.name}</span>
                          <span className="text-sm text-gray-500">{item.usage.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">타입 상성</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-lg">방어 상성</h4>
                    <div className="space-y-2">
                      {(() => {
                        const pokemonTypeNames = pokemon.types.map((t) => t.type.name);
                        const defensive = getDefensiveEffectiveness(pokemonTypeNames);
                        const weak = Object.entries(defensive).filter(([_, mult]) => mult > 1);
                        const resistant = Object.entries(defensive).filter(([_, mult]) => mult < 1 && mult > 0);
                        const immune = Object.entries(defensive).filter(([_, mult]) => mult === 0);

                        return (
                          <>
                            {weak.length > 0 && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">약점 (효과 굉장)</p>
                                <div className="flex flex-wrap gap-1">
                                  {weak.map(([type, mult]) => (
                                    <Badge
                                      key={type}
                                      className="text-xs"
                                      style={{
                                        backgroundColor: getTypeColor(type),
                                        color: '#fff',
                                        border: 'none'
                                      }}
                                    >
                                      {getKoreanTypeName(type)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {resistant.length > 0 && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">저항 (효과 별로)</p>
                                <div className="flex flex-wrap gap-1">
                                  {resistant.map(([type, mult]) => (
                                    <Badge
                                      key={type}
                                      className="text-xs"
                                      style={{
                                        backgroundColor: getTypeColor(type),
                                        color: '#fff',
                                        border: 'none'
                                      }}
                                    >
                                      {getKoreanTypeName(type)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {immune.length > 0 && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">무효 (효과 없음)</p>
                                <div className="flex flex-wrap gap-1">
                                  {immune.map(([type]) => (
                                    <Badge
                                      key={type}
                                      className="text-xs"
                                      style={{
                                        backgroundColor: getTypeColor(type),
                                        color: '#fff',
                                        border: 'none'
                                      }}
                                    >
                                      {getKoreanTypeName(type)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-lg">공격 상성</h4>
                    <div className="space-y-2">
                      {(() => {
                        const pokemonTypeNames = pokemon.types.map((t) => t.type.name);
                        const offensive = getOffensiveEffectiveness(pokemonTypeNames);
                        const superEffective = Object.entries(offensive).filter(([_, mult]) => mult > 1);
                        const notVeryEffective = Object.entries(offensive).filter(([_, mult]) => mult < 1 && mult > 0);
                        const noEffect = Object.entries(offensive).filter(([_, mult]) => mult === 0);

                        return (
                          <>
                            {superEffective.length > 0 && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">효과 굉장(자속)</p>
                                <div className="flex flex-wrap gap-1">
                                  {superEffective.map(([type, mult]) => (
                                    <Badge
                                      key={type}
                                      className="text-xs"
                                      style={{
                                        backgroundColor: getTypeColor(type),
                                        color: '#fff',
                                        border: 'none'
                                      }}
                                    >
                                      {getKoreanTypeName(type)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {notVeryEffective.length > 0 && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">효과 별로</p>
                                <div className="flex flex-wrap gap-1">
                                  {notVeryEffective.map(([type, mult]) => (
                                    <Badge
                                      key={type}
                                      className="text-xs"
                                      style={{
                                        backgroundColor: getTypeColor(type),
                                        color: '#fff',
                                        border: 'none'
                                      }}
                                    >
                                      {getKoreanTypeName(type)} ×{mult}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {noEffect.length > 0 && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">효과 없음</p>
                                <div className="flex flex-wrap gap-1">
                                  {noEffect.map(([type]) => (
                                    <Badge
                                      key={type}
                                      className="text-xs"
                                      style={{
                                        backgroundColor: getTypeColor(type),
                                        color: '#fff',
                                        border: 'none'
                                      }}
                                    >
                                      {getKoreanTypeName(type)} ×0
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">추천 기술</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {competitiveStats.moves.map((move, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-lg border-2"
                      style={{ borderColor: getTypeColor(move.type) }}
                    >
                      <Image
                        src={`/poke-types/${move.type}.svg`}
                        alt={move.type}
                        width={20}
                        height={20}
                      />
                      <span className="flex-1 font-medium text-gray-900">{move.name}</span>
                      <span className="text-sm text-gray-600">{move.usage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
