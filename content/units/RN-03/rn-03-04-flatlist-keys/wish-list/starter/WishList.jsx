// WishList.jsx: the list of wishes. Turn it into a FlatList.
import { ScrollView } from 'react-native';
import { EmptyWishes } from './EmptyWishes.jsx';
import { Separator } from './Separator.jsx';
import { WishCard } from './WishCard.jsx';

export function WishList({ wishes }) {
  return (
    <ScrollView>
      {wishes.map((wish, index) => (
        <WishCard key={index} wish={wish} />
      ))}
    </ScrollView>
  );
}
