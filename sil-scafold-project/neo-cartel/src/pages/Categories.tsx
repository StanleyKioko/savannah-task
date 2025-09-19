import { Helmet } from 'react-helmet-async';

const Categories = () => {
  return (
    <>
      <Helmet>
        <title>Categories - EStore | Browse Product Categories</title>
        <meta name="description" content="Browse all product categories at EStore. Find electronics, clothing, books, and more." />
      </Helmet>
      <div className="container-fluid py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Product Categories</h1>
        <p className="text-center text-muted-foreground">Coming soon - Browse all our product categories</p>
      </div>
    </>
  );
};

export default Categories;