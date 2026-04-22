# numbers =[1,2,3,4,5,6,7,8]
# squares = [x**2 for x in numbers]
# print(squares) 

l1 = [1,2,3,4,5,6,7,8,]
user_input = input("enter a number even or odd")
for i in l1:
    if user_input == "even":
     if i%2==0:
        print(i)
    elif user_input =="odd":
        if i%2!=0:
            print(i)
    elif user_input =="i**2":
            print(i)
    else:
         print(i)





