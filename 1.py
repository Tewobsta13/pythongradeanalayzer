name=input("Enter your name ")
result1=float(input("Enter result for subject 1 "))
result2=float(input("Enter result for subject 2 "))
result3=float(input("Enter result for subject 3 "))
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
    
print("Your status", name)
print("Your average mark is", average)
print("Your grade is ", grade)
print("your status is",result)