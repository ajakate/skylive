import { Text, View } from 'react-native';

export default function LoadingScreen() {
    return (
        <View
            style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Text style={{ fontSize: 30 }}>Loading...</Text>
        </View>
    )
}
