import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  return (
    <>
      <Helmet>
        <title>{`${query ? `Search Results for "${query}"` : 'Search'} - EStore`}</title>
        <meta name="description" content={`Search results for ${query || 'products'} at EStore. Find products, deals, and more.`} />
      </Helmet>
      <div className="container-fluid py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          {query ? `Search Results for "${query}"` : 'Search Products'}
        </h1>
        <p className="text-center text-muted-foreground">
          {query ? 'Coming soon - Search functionality' : 'Enter a search term to find products'}
        </p>
      </div>
    </>
  );
};

export default Search;