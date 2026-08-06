import time
correct_Username= "admin"
correct_Password= "admin123"
attempts = 0
while attempts < 5:
    username = input("Enter your username: ")
    password = input("Enter your password: ")
    
    if username == correct_Username and password == correct_Password:
        print("access Granted!")
        import py1
        break
    else:
        attempts += 1
        
        if attempts == 5:
            print("access denied! You have exceeded the maximum number of attempts.")
            break
        print("Incorrect username or password. Please try again.")
        if attempts==1:
            print("please wait 5 seconds before trying again.")
            time.sleep(5)
        if attempts==2:
            print("please wait 10 seconds before trying again.")
            time.sleep(10)  
        if attempts==3:
            print("please wait 20 seconds before trying again.")
            time.sleep(20)
        if attempts==4:
            print("please wait 30 seconds before trying again.")
            time.sleep(30)
            


