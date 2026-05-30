import 'package:flutter_test/flutter_test.dart';
import 'package:sikapa_storefront/src/core/dsa/trie.dart';

void main() {
  test('Trie returns prefix matches', () {
    final trie = Trie<String>();
    trie.insert('lipstick', 'a');
    trie.insert('lip gloss', 'b');
    trie.insert('serum', 'c');

    expect(trie.searchPrefix('lip', limit: 5), ['a', 'b']);
    expect(trie.searchPrefix('ser', limit: 5), ['c']);
  });
}
