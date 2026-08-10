def reverse_text(text):
    return text[::-1]
    # python slicing (start:stop:step) here step can be like alt reverse etc

def reverse_words(text):
    words = text.split()
    words.reverse()
    return " ".join(words)

while True:
    
    print("\n1. Reverse letters")
    print("2. Reverse words")
    print("3.Exit")

    
    choice = input("Choose an option: ")


    if choice == "3":
        print("GoodBye")
        break

    if choice != "1" and choice != "2":
        print("Invalid Option")
        continue


    text = input("Enter something: ").lower()


    if choice == "1":
        print("\nOriginal :", text)
        print("Reversed:", reverse_text(text))
    elif choice == "2":
        print("\nOriginal :", text)
        print("Words Reversed:", reverse_words(text))







