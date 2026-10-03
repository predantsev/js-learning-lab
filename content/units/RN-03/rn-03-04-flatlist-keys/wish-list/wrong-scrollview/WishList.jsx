// Wrong: a ScrollView with map mounts every card at once, even with id keys.
import { ScrollView, View } from 'react-native';
import { EmptyWishes } from './EmptyWishes.jsx';
import { Separator } from './Separator.jsx';
import { WishCard } from './WishCard.jsx';

export function WishList({ wishes }) {
  if (wishes.length === 0) return <EmptyWishes />;
  return (
    <ScrollView>
      {wishes.map((wish, index) => (
        <View key={wish.id}>
          {index > 0 && <Separator />}
          <WishCard wish={wish} />
        </View>
      ))}
    </ScrollView>
  );
}
