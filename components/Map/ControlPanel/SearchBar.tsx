import React, { useState } from 'react';
import { TextInput, View, Button } from 'react-native';

interface SearchBarProps {
    onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
    const [query, setQuery] = useState('');

    const handleSearch = () => {
        onSearch(query);
    };

    return (
        <View style={{ flexDirection: 'row' }}>
            <TextInput
                style={{ flex: 1, borderWidth: 1, padding: 8 }}
                placeholder="Search for a place"
                value={query}
                onChangeText={setQuery}
            />
            <Button title="Search" onPress={handleSearch} />
        </View>
    );
}
