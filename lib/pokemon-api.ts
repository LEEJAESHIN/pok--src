import { Pokemon, PokemonSpecies } from "./api-types/pokemon";
import { PokemoemBattleStats, CompetitiveRecommendations } from "./api-types/pokemoem";
import pokemonNameMap from "./data/pokemon-name-map.json";

const BASE_URL = "https://pokeapi.co/api/v2";
const POKEMOEM_API_URL = "https://api.pokemoem.com/battlestat/details/today";
const POKEMOEM_ITEM_API_URL = "https://api.pokemoem.com/pokedex/item";

// 한글로 포켓몬 이름 찾기 (JSON 파일 사용 - 즉시 반환!)
export function searchPokemonByKoreanName(koreanName: string): string | null {
  return pokemonNameMap[koreanName as keyof typeof pokemonNameMap] || null;
}

// 포켓몬 데이터 가져오기
export async function getPokemonByName(name: string): Promise<Pokemon | null> {
  try {
    const response = await fetch(`${BASE_URL}/pokemon/${name.toLowerCase()}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error fetching Pokemon:", error);
    return null;
  }
}

// 포켓몬 종 정보 가져오기 (한글 이름 포함)
export async function getPokemonSpecies(
  id: number
): Promise<PokemonSpecies | null> {
  try {
    const response = await fetch(`${BASE_URL}/pokemon-species/${id}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error fetching Pokemon species:", error);
    return null;
  }
}

// 한글 이름 추출
export function getKoreanName(species: PokemonSpecies): string {
  const koreanName = species.names.find((n) => n.language.name === "ko");
  return koreanName?.name || species.name;
}

// 통합 검색 함수
export async function searchPokemon(query: string): Promise<Pokemon | null> {
  // 영어 이름으로 먼저 시도
  let pokemon = await getPokemonByName(query);

  // 실패하면 한글 이름으로 검색 (JSON에서 즉시 조회!)
  if (!pokemon) {
    const englishName = searchPokemonByKoreanName(query);
    if (englishName) {
      pokemon = await getPokemonByName(englishName);
    }
  }

  return pokemon;
}

// PokeAPI에서 한글 이름 가져오기 (ID -> 한글 이름 변환)
async function getKoreanNameFromPokeAPI(
  endpoint: string,
  id: string
): Promise<string> {
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}/${id}`, {
      next: { revalidate: 86400 }, // 24시간 캐시
    });
    if (!response.ok) return id;
    const data = await response.json();

    // 한글 이름 찾기
    if (data.names) {
      const koreanName = data.names.find((n: any) => n.language.name === "ko");
      if (koreanName?.name) return koreanName.name;
    }

    // 한글 이름이 없으면 영어 이름 반환
    return data.name || id;
  } catch {
    return id;
  }
}

// Pokemoem API에서 아이템 한글 이름 가져오기
async function getItemNameFromPokemoem(itemId: string): Promise<string> {
  try {
    const response = await fetch(`${POKEMOEM_ITEM_API_URL}/${itemId}`, {
      next: { revalidate: 86400 }, // 24시간 캐시
    });
    if (!response.ok) return `Item ${itemId}`;
    const data = await response.json();

    // 한글 이름 우선, 없으면 영어 이름
    return data.nameko || data.name || `Item ${itemId}`;
  } catch {
    return `Item ${itemId}`;
  }
}

// Move 상세 정보 가져오기 (한글 이름 + 타입)
async function getMoveDetails(moveId: string): Promise<{ name: string; type: string } | null> {
  try {
    const response = await fetch(`${BASE_URL}/move/${moveId}`, {
      next: { revalidate: 86400 }, // 24시간 캐시
    });
    if (!response.ok) return null;
    const data = await response.json();

    // 한글 이름 찾기
    const koreanName = data.names?.find((n: any) => n.language.name === "ko");

    return {
      name: koreanName?.name || data.name || moveId,
      type: data.type.name, // 타입 정보 추가
    };
  } catch {
    return null;
  }
}

// 오늘의 포켓몬 랜덤 6마리 가져오기 (날짜 기반 시드)
export async function getTodaysPokemon(): Promise<Array<{ id: number; name: string; koreanName: string; sprite: string }>> {
  try {
    // pokemon-names.json 가져오기
    const pokemonNamesModule = await import("./data/pokemon-names.json");
    const pokemonNames = pokemonNamesModule.default;

    // 오늘 날짜를 시드로 사용 (매일 같은 포켓몬 보장)
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    // 시드 기반 랜덤 함수
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // 랜덤 인덱스 6개 생성
    const randomIndices = new Set<number>();
    let currentSeed = seed;

    while (randomIndices.size < 6) {
      const randomIndex = Math.floor(seededRandom(currentSeed++) * pokemonNames.length);
      randomIndices.add(randomIndex);
    }

    // 각 포켓몬 데이터 가져오기
    const pokemonPromises = Array.from(randomIndices).map(async (index) => {
      const pokemonData = pokemonNames[index];
      const pokemon = await getPokemonByName(pokemonData.english);

      if (!pokemon) {
        return null;
      }

      return {
        id: pokemon.id,
        name: pokemon.name,
        koreanName: pokemonData.korean,
        sprite: pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default
      };
    });

    const results = await Promise.all(pokemonPromises);
    return results.filter((p) => p !== null) as Array<{ id: number; name: string; koreanName: string; sprite: string }>;
  } catch (error) {
    console.error("Error fetching today's Pokemon:", error);
    return [];
  }
}

// Pokemoem 배틀 통계 가져오기 (한국 배틀 데이터)
export async function getCompetitiveStats(
  pokemonId: number
): Promise<CompetitiveRecommendations | null> {
  try {
    // rule=0은 일반 배틀, form=0은 기본 폼
    const url = `${POKEMOEM_API_URL}/${pokemonId}/0?rule=0`;
    const response = await fetch(url, { next: { revalidate: 3600 } }); // 1시간 캐시

    if (!response.ok) return null;

    const data: PokemoemBattleStats = await response.json();

    // 상위 2개 특성 (ID -> 한글 이름 변환)
    const abilitiesPromises = data.abilities
      .slice(0, 2)
      .map(async (item) => ({
        name: await getKoreanNameFromPokeAPI("ability", item.id),
        usage: parseFloat(item.val),
      }));

    // 상위 2개 성격 (ID -> 한글 이름 변환)
    const naturesPromises = data.natures
      .slice(0, 2)
      .map(async (item) => ({
        name: await getKoreanNameFromPokeAPI("nature", item.id),
        usage: parseFloat(item.val),
      }));

    // 상위 2개 도구 (ID -> 한글 이름 변환)
    const itemsPromises = data.items
      .slice(0, 2)
      .map(async (item) => ({
        name: await getItemNameFromPokemoem(item.id),
        usage: parseFloat(item.val),
      }));

    // 상위 4개 기술 (ID -> 한글 이름 + 타입 변환)
    const movesPromises = data.moves
      .slice(0, 4)
      .map(async (item) => {
        const moveDetails = await getMoveDetails(item.id);
        return {
          name: moveDetails?.name || item.id,
          type: moveDetails?.type || "normal",
          usage: parseFloat(item.val),
        };
      });

    const [abilities, natures, items, moves] = await Promise.all([
      Promise.all(abilitiesPromises),
      Promise.all(naturesPromises),
      Promise.all(itemsPromises),
      Promise.all(movesPromises),
    ]);

    return { abilities, natures, items, moves };
  } catch (error) {
    console.error("Error fetching Pokemoem stats:", error);
    return null;
  }
}
