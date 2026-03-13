export type EnrollmentJuzTestStatus = "pass" | "fail" | "review"
export type EnrollmentJuzReviewStatus = "pass" | "fail" | "needs_mastery"

const TEST_STATUSES = ["pass", "fail", "review"] as const
const REVIEW_STATUSES = ["pass", "fail", "needs_mastery"] as const

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeStatusMap<T extends string>(value: unknown, allowed: readonly T[]) {
  if (!isObjectRecord(value)) return {} as Record<number, T>

  return Object.entries(value).reduce<Record<number, T>>((accumulator, [key, status]) => {
    const juzNumber = Number.parseInt(key, 10)
    if (!Number.isNaN(juzNumber) && allowed.includes(status as T)) {
      accumulator[juzNumber] = status as T
    }
    return accumulator
  }, {})
}

export function normalizeEnrollmentTestResults(value: unknown) {
  return normalizeStatusMap(value, TEST_STATUSES)
}

export function normalizeEnrollmentReviewResults(value: unknown) {
  return normalizeStatusMap(value, REVIEW_STATUSES)
}

export function normalizeSelectedJuzs(value: unknown) {
  if (!Array.isArray(value)) return [] as number[]

  return Array.from(
    new Set(
      value
        .map((item) => Number.parseInt(String(item), 10))
        .filter((juzNumber) => Number.isInteger(juzNumber) && juzNumber >= 1 && juzNumber <= 30),
    ),
  ).sort((left, right) => left - right)
}

export function parseMemorizedJuzRange(amount?: string | null) {
  if (!amount) return null

  if (amount.includes("-")) {
    const [from, to] = amount.split("-").map((part) => Number.parseInt(part, 10))
    if (!Number.isNaN(from) && !Number.isNaN(to) && from >= 1 && to <= 30) {
      return { fromJuz: Math.min(from, to), toJuz: Math.max(from, to) }
    }
    return null
  }

  const juzNumber = Number.parseInt(amount, 10)
  if (Number.isNaN(juzNumber) || juzNumber < 1 || juzNumber > 30) {
    return null
  }

  return { fromJuz: juzNumber, toJuz: juzNumber }
}

export function getJuzNumbersFromAmount(amount?: string | null) {
  const parsedRange = parseMemorizedJuzRange(amount)
  if (!parsedRange) {
    return []
  }

  return Array.from(
    { length: parsedRange.toJuz - parsedRange.fromJuz + 1 },
    (_, index) => parsedRange.fromJuz + index,
  )
}

export function getTestableJuzNumbers(selectedJuzs?: number[] | null, amount?: string | null) {
  const normalizedSelectedJuzs = normalizeSelectedJuzs(selectedJuzs)
  if (normalizedSelectedJuzs.length > 0) {
    return normalizedSelectedJuzs
  }

  return getJuzNumbersFromAmount(amount)
}

export function isContiguousJuzSelection(juzs?: number[] | null) {
  const normalizedJuzs = normalizeSelectedJuzs(juzs)
  if (normalizedJuzs.length <= 1) {
    return true
  }

  for (let index = 1; index < normalizedJuzs.length; index += 1) {
    if (normalizedJuzs[index] !== normalizedJuzs[index - 1] + 1) {
      return false
    }
  }

  return true
}

export function getContiguousSelectedJuzRange(juzs?: number[] | null) {
  const normalizedJuzs = normalizeSelectedJuzs(juzs)
  if (normalizedJuzs.length === 0 || !isContiguousJuzSelection(normalizedJuzs)) {
    return null
  }

  return {
    fromJuz: normalizedJuzs[0],
    toJuz: normalizedJuzs[normalizedJuzs.length - 1],
  }
}

export function getInitialPassedJuzNumbers(testResults?: Record<number, EnrollmentJuzTestStatus>) {
  if (!testResults) return []

  return Object.entries(testResults)
    .filter(([, status]) => status === "pass")
    .map(([juzNumber]) => Number(juzNumber))
    .sort((left, right) => left - right)
}

export function getReviewRequestedJuzNumbers(testResults?: Record<number, EnrollmentJuzTestStatus>) {
  if (!testResults) return []

  return Object.entries(testResults)
    .filter(([, status]) => status === "review")
    .map(([juzNumber]) => Number(juzNumber))
    .sort((left, right) => left - right)
}

export function filterReviewResultsByReviewRequestedJuzs(
  testResults: Record<number, EnrollmentJuzTestStatus>,
  reviewResults?: Record<number, EnrollmentJuzReviewStatus>,
) {
  if (!reviewResults) return {}

  const reviewRequestedJuzs = new Set(getReviewRequestedJuzNumbers(testResults))

  return Object.entries(reviewResults).reduce<Record<number, EnrollmentJuzReviewStatus>>((accumulator, [key, status]) => {
    const juzNumber = Number.parseInt(key, 10)
    if (!Number.isNaN(juzNumber) && reviewRequestedJuzs.has(juzNumber)) {
      accumulator[juzNumber] = status
    }
    return accumulator
  }, {})
}

export function getPassedJuzNumbers(
  testResults?: Record<number, EnrollmentJuzTestStatus>,
  reviewResults?: Record<number, EnrollmentJuzReviewStatus>,
) {
  const directPassedJuzs = getInitialPassedJuzNumbers(testResults)
  const reviewedPassedJuzs = getReviewRequestedJuzNumbers(testResults).filter((juzNumber) => reviewResults?.[juzNumber] === "pass")

  return Array.from(new Set([...directPassedJuzs, ...reviewedPassedJuzs])).sort((left, right) => left - right)
}

export function getNeedsMasteryJuzNumbers(
  testResults?: Record<number, EnrollmentJuzTestStatus>,
  reviewResults?: Record<number, EnrollmentJuzReviewStatus>,
) {
  return getReviewRequestedJuzNumbers(testResults).filter((juzNumber) => reviewResults?.[juzNumber] === "needs_mastery")
}

export function formatEnrollmentMemorizedAmount(amount?: string | null, selectedJuzs?: number[] | null) {
  const normalizedSelectedJuzs = normalizeSelectedJuzs(selectedJuzs)
  if (normalizedSelectedJuzs.length > 0) {
    if (normalizedSelectedJuzs.length === 1) {
      return `الجزء ${normalizedSelectedJuzs[0]}`
    }

    if (isContiguousJuzSelection(normalizedSelectedJuzs)) {
      return `من الجزء ${normalizedSelectedJuzs[0]} إلى الجزء ${normalizedSelectedJuzs[normalizedSelectedJuzs.length - 1]}`
    }

    return `أجزاء متفرقة: ${normalizedSelectedJuzs.join("، ")}`
  }

  if (!amount) return "-"
  if (amount.includes("-")) {
    const [from, to] = amount.split("-")
    if (from === to) return `الجزء ${from}`
    return `من الجزء ${from} إلى الجزء ${to}`
  }
  return amount
}

export function formatJuzList(juzs?: number[]) {
  if (!juzs || juzs.length === 0) return ""

  return juzs
    .slice()
    .sort((left, right) => left - right)
    .map((juzNumber) => `الجزء ${juzNumber}`)
    .join("، ")
}