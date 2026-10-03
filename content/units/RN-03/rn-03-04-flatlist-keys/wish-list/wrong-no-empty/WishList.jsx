// Wrong: an empty list shows nothing at all.
import { FlatList } from 'react-native';
import { Separator } from './Separator.jsx';
import { WishCard } from './WishCard.jsx';

export function WishList({ wishes }) {
  return (
    <FlatList
      data={wishes}
      keyExtractor={(wish) => wish.id}
      renderItem={({ item }) => <WishCard wish={item} />}
      ItemSeparatorComponent={Separator}
    />
  );
}
