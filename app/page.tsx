import { redirect } from 'next/navigation';

const HomePage: React.FC = () => {
  redirect('/account');
};

export default HomePage;
