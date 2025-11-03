import Link from '@/components/Link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-start justify-start md:mt-24 md:flex-row md:items-center md:justify-center md:space-x-6">
      <div className="space-x-2 pb-8 pt-6 md:space-y-5">
        <h1 className="text-6xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 md:border-r-2 md:px-6 md:text-8xl md:leading-14">
          404
        </h1>
      </div>
      <div className="max-w-md">
        <p className="mb-4 text-xl font-bold leading-normal md:text-2xl">
          찾으시는 페이지가 보이지 않아요.
        </p>
        <p className="mb-8">괜찮아요, 다른 글들은 아래 버튼을 눌러 홈에서 다시 만나보세요.</p>
        <Link
          href="/"
          className="inline rounded-lg border border-transparent bg-primary-500 px-4 py-2 text-sm font-medium leading-5 text-white shadow transition-colors duration-150 hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:hover:bg-primary-400"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
