// WishList.jsx: the list of wishes. Turn it into a FlatList.
import { FlatList } from 'react-native';
import { EmptyWishes } from './EmptyWishes.jsx';
import { Separator } from './Separator.jsx';
import { WishCard } from './WishCard.jsx';

export function WishList({ wishes }) {
  return (
    <FlatList
      data={wishes}
      keyExtractor={(wish) => wish.id}
      renderItem={({ item }) => <WishCard wish={item} />}
      ItemSeparatorComponent={Separator}
      ListEmptyComponent={EmptyWishes}
    />
  );
}
