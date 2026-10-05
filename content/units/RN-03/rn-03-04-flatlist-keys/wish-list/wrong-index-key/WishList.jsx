// Wrong: the key is the index, so row state belongs to a position, not to a wish.
import { FlatList } from 'react-native';
import { EmptyWishes } from './EmptyWishes.jsx';
import { Separator } from './Separator.jsx';
import { WishCard } from './WishCard.jsx';

export function WishList({ wishes }) {
  return (
    <FlatList
      data={wishes}
      keyExtractor={(wish, index) => String(index)}
      renderItem={({ item }) => <WishCard wish={item} />}
      ItemSeparatorComponent={Separator}
      ListEmptyComponent={EmptyWishes}
    />
  );
}
