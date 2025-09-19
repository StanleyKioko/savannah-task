import { Helmet } from 'react-helmet-async';

const Deals = () => {
  return (
    <>
      <Helmet>
        <title>Deals - EStore | Special Offers & Discounts</title>
        <meta name="description" content="Find the best deals and special offers at EStore. Save money on electronics, clothing, and more." />
      </Helmet>
      <div className="container-fluid py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Special Deals</h1>
        <p className="text-center text-muted-foreground">Coming soon - Check out our amazing deals and offers</p>
      </div>
    </>
  );
};

export default Deals;