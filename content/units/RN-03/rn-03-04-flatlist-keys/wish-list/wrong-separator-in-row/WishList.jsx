// Wrong: every row draws its own separator, so there is one after the last card too.
import { FlatList } from 'react-native';
import { EmptyWishes } from './EmptyWishes.jsx';
import { Separator } from './Separator.jsx';
import { WishCard } from './WishCard.jsx';

export function WishList({ wishes }) {
  return (
    <FlatList
      data={wishes}
      keyExtractor={(wish) => wish.id}
      renderItem={({ item }) => (
        <>
          <WishCard wish={item} />
          <Separator />
        </>
      )}
      ListEmptyComponent={EmptyWishes}
    />
  );
}
