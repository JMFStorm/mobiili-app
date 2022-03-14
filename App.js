import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  TextInput,
  Text,
  Pressable,
  FlatList,
  View,
  Image,
  Keyboard,
} from "react-native";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabase("meal.db");
const baseUrl = "https://www.themealdb.com/api/json/v1/1/filter.php";

const fetchMeals = async (keyword) => {
  try {
    const params = `?i=${keyword ?? ""}`;
    const response = await fetch(baseUrl + params);
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export default function App() {
  const [showFavourites, setShowFavourites] = React.useState(false);
  const [keyword, setKeyword] = React.useState("");
  const [meals, setMeals] = React.useState([]);
  const [favourites, setFavourites] = React.useState([]);

  React.useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists meal (id integer primary key not null, name text, image text);"
      );
    });
    updateList();
  }, []);

  const updateList = () => {
    db.transaction((tx) => {
      tx.executeSql("select * from meal;", [], (_, { rows }) => {
        setFavourites(rows._array);
        // console.log("rows._array", rows._array);
      });
    });
  };

  const saveItem = (id, name, image) => {
    db.transaction(
      (tx) => {
        tx.executeSql("insert into meal (id, name, image) values (?, ?, ?);", [
          id,
          name,
          image,
        ]);
      },
      null,
      updateList
    );
  };

  const addFavourite = (mealObject) => {
    saveItem(mealObject.idMeal, mealObject.strMeal, mealObject.strMealThumb);
  };

  const removeFavourite = (id) => {
    deleteItem(id);
  };

  const deleteItem = (id) => {
    db.transaction(
      (tx) => {
        tx.executeSql(`delete from meal where id = ?;`, [id]);
      },
      null,
      updateList
    );
  };

  const getMeals = React.useCallback(async () => {
    const meals = await fetchMeals(keyword);
    setMeals(meals.meals);
    Keyboard.dismiss();
  }, [fetchMeals, keyword, meals]);

  const nameInFavourites = React.useCallback(
    (name) => {
      const exists = favourites?.find((x) => x.name == name);
      return Boolean(exists);
    },
    [favourites]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.buttons}>
        <Pressable
          style={styles.button}
          onPress={() => setShowFavourites(false)}
          title="Search Meals"
          accessibilityLabel="View Meals"
        >
          <Text style={styles.text}>View Meals</Text>
        </Pressable>
        <Pressable
          style={styles.button}
          onPress={() => setShowFavourites(true)}
          title="Favourites"
          accessibilityLabel="View Favourites"
        >
          <Text style={styles.text}>View Favourites</Text>
        </Pressable>
      </View>
      {showFavourites && (
        <View
          style={{
            width: "100%",
          }}
        >
          {!!favourites && (
            <FlatList
              data={favourites}
              keyExtractor={(meal) => meal.id}
              renderItem={({ item }) => (
                <View
                  style={{
                    display: "flex",
                    marginBottom: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{item.name}</Text>
                  <Image
                    style={{ width: 100, height: 100 }}
                    resizeMode={"cover"}
                    source={{
                      uri: item.image,
                    }}
                  />
                  <Pressable
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 24,
                      borderRadius: 4,
                      elevation: 3,
                      backgroundColor: "#2222cc",
                    }}
                    onPress={() => removeFavourite(item.id)}
                    title="Remove"
                    accessibilityLabel="Remove"
                  >
                    <Text style={styles.text}>Remove</Text>
                  </Pressable>
                </View>
              )}
            />
          )}
        </View>
      )}
      {!showFavourites && (
        <View
          style={{
            width: "100%",
          }}
        >
          <TextInput
            style={styles.input}
            onChangeText={setKeyword}
            value={keyword}
          />
          <View style={styles.buttons}>
            <Pressable
              style={styles.button}
              onPress={() => getMeals()}
              title="Search"
              accessibilityLabel="Search"
            >
              <Text style={styles.text}>
                {keyword ? "Search Keyword" : "Search All"}
              </Text>
            </Pressable>
          </View>
          <View
            style={{
              width: "100%",
            }}
          >
            {!!meals && (
              <FlatList
                data={meals}
                keyExtractor={(meal) => meal.idMeal}
                renderItem={({ item }) => (
                  <View
                    style={{
                      display: "flex",
                      marginBottom: 16,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{item.strMeal}</Text>
                    <Image
                      style={{ width: 100, height: 100 }}
                      resizeMode={"cover"}
                      source={{
                        uri: item.strMealThumb,
                      }}
                    />
                    <Pressable
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 24,
                        borderRadius: 4,
                        elevation: 3,
                        backgroundColor: "#2222cc",
                      }}
                      onPress={() => addFavourite(item)}
                      title="Add Favourite"
                      accessibilityLabel="Add Favourite"
                    >
                      <Text style={styles.text}>
                        {nameInFavourites(item.strMeal)
                          ? "Favourited"
                          : "Add Favourite"}
                      </Text>
                    </Pressable>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    alignItems: "center",
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    width: "95%",
  },
  buttons: {
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "95%",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: "#2222cc",
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "bold",
    letterSpacing: 0.25,
    color: "white",
  },
  tinyLogo: {
    width: 50,
    height: 50,
  },
});
