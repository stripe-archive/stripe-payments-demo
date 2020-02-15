import React, {useEffect, useState} from 'react';
import Header from './components/Header';
import Aside from './components/Aside';

function App() {
  const [products, setProducts] = useState();
  useEffect(_ => {
    (async _ => {
      const res = await fetch('/products').then(res => res.json());
      setProducts(res.data);
    })();
  }, []);

  return (
    <>
      <main id="main" className="checkout">
        <Header />
      </main>
      <Aside></Aside>
    </>
  );
}

export default App;
