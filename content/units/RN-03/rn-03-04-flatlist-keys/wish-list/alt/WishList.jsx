// WishList.jsx: no keyExtractor — FlatList's default takes item.key, then item.id; elements instead of components.
import { FlatList } from 'react-native';
import { EmptyWishes } from './EmptyWishes.jsx';
import { Separator } from './Separator.jsx';
import { WishCard } from './WishCard.jsx';

function renderWish({ item }) {
  return <WishCard wish={item} />;
}

export function WishList({ wishes }) {
  return (
    <FlatList
      data={wishes}
      renderItem={renderWish}
      ItemSeparatorComponent={() => <Separator />}
      ListEmptyComponent={<EmptyWishes />}
    />
  );
}
