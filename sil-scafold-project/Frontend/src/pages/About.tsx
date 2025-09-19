import { Helmet } from 'react-helmet-async';

const About = () => {
  return (
    <>
      <Helmet>
        <title>About Us - EStore | Learn More About Our Company</title>
        <meta name="description" content="Learn more about EStore - your trusted online shopping destination for electronics, clothing, books, and more." />
      </Helmet>
      <div className="container-fluid py-8">
        <h1 className="text-3xl font-bold text-center mb-8">About EStore</h1>
        <div className="max-w-3xl mx-auto prose prose-gray">
          <p className="text-center text-muted-foreground">
            Welcome to EStore - your premier online shopping destination offering quality products at competitive prices.
          </p>
        </div>
      </div>
    </>
  );
};

export default About;