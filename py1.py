name=input("Enter your name ")

while True:
    result1 = float(input("Enter result for subject 1: "))
    if 0 <= result1 <= 100:
        break
    print("Error! Result must be between 0 and 100.")

while True:
    result2 = float(input("Enter result for subject 2: "))
    if 0 <= result2 <= 100:
        break
    print("Error! Result must be between 0 and 100.")

while True:
    result3 = float(input("Enter result for subject 3: "))
    if 0 <= result3 <= 100:
        break
    print("Error! Result must be between 0 and 100.")


average=(result1+result2+result3)/3
if average>=85:
        grade="A"
elif average>=70:
        grade="B"
elif average>=60:
        grade="C"
elif average>=50:
        grade="D"
else:
        grade="F"
    
if average>=50:
        result="Pass"
else:
        result="Fail"
    
print("Your result", name)
print("Your average mark is", average)
print("Your grade is ", grade)
print("your status is",result)