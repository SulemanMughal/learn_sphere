from django import template

register = template.Library()

@register.filter(name='has_group')
def has_group(user, group_name):
    """Returns True if the user is in the given group."""
    if not user.is_authenticated:
        return False
    return user.groups.filter(name=group_name).exists()




@register.filter
def get_item(sequence, index):
    try:
        return sequence[int(index)]
    except (IndexError, ValueError, TypeError):
        return None
